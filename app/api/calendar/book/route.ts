import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

async function getCalendarClientForBusiness(businessId: string) {
  const db = await getDb();
  const business = await db.collection("businesses").findOne({
    _id: new ObjectId(businessId),
  });

  if (!business?.googleRefreshToken) {
    throw new Error("No Google Calendar connected for this business");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ 
    refresh_token: business.googleRefreshToken 
  });

  return {
    oauth2Client,
    googleEmail: business.googleEmail || "noreply@example.com",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessName,
      attendeeEmail,
      startISO,
      endISO,
      meetingType = "appointment",
      businessId,
      customerId,
      customerName,
      phone,
      service = "Appointment",
    } = body;

    console.log("📅 Booking request:", {
      customerName,
      attendeeEmail,
      startISO,
      endISO,
      service,
      businessId,
    });

    // Validate required fields
    if (!attendeeEmail || !startISO || !endISO) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: attendeeEmail, startISO, endISO" },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        { success: false, error: "Missing customerName" },
        { status: 400 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "Missing businessId" },
        { status: 400 }
      );
    }

    // ✅ Get tenant-specific OAuth client and email
    const { oauth2Client, googleEmail } = await getCalendarClientForBusiness(businessId);
    
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Get calendar ID from business settings or use primary
    const db = await getDb();
    const settings = await db.collection("business_settings").findOne({ businessId });
    const calendarId = settings?.googleCalendarId || "primary";

    // ✅ Check for conflicts first
    const conflictCheck = await calendar.events.list({
      calendarId,
      timeMin: startISO,
      timeMax: endISO,
      singleEvents: true,
    });

    if (conflictCheck.data.items && conflictCheck.data.items.length > 0) {
      console.log("⚠️ Time slot conflict detected");
      return NextResponse.json(
        { 
          success: false, 
          error: "Time slot already booked - please choose another time",
          conflicts: conflictCheck.data.items 
        },
        { status: 409 }
      );
    }

    // ✅ Create event title with customer name
    const eventTitle = `${customerName} - ${service}`;

    // ✅ Create Google Calendar event
    const event = {
      summary: eventTitle,
      description: `
Customer: ${customerName}
Phone: ${phone || "N/A"}
Email: ${attendeeEmail}
Service: ${service}
Type: ${meetingType}
Business: ${businessName || ""}
Customer ID: ${customerId || "N/A"}
Business ID: ${businessId || "N/A"}
      `.trim(),
      start: {
        dateTime: startISO,
        timeZone: "America/New_York",
      },
      end: {
        dateTime: endISO,
        timeZone: "America/New_York",
      },
      attendees: [
        { 
          email: attendeeEmail,
          displayName: customerName,
          responseStatus: "needsAction"
        }
      ],
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "email", minutes: 60 },      // 1 hour before
          { method: "popup", minutes: 30 },
        ],
      },
    };

    console.log("📝 Creating Google Calendar event:", eventTitle);

    const response = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      sendUpdates: "none", // We'll send custom email instead
      requestBody: event,
    });

    const createdEvent = response.data;
    const eventId = createdEvent.id || "";
    const meetLink = createdEvent.hangoutLink || createdEvent.conferenceData?.entryPoints?.[0]?.uri || "";
    const htmlLink = createdEvent.htmlLink || "";

    console.log("✅ Google Calendar event created:", eventId);

    // ✅ Save to MongoDB appointments collection
    const appointmentDoc = {
      businessId: businessId || "",
      customerId: customerId || "",
      customerName: customerName || "",
      customerPhone: phone || "",
      attendeeEmail,
      service: service || "Appointment",
      startISO,
      endISO,
      meetLink,
      googleEventId: eventId,
      googleHtmlLink: htmlLink,
      status: "confirmed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection("appointments").insertOne(appointmentDoc);
    console.log("✅ Appointment saved to MongoDB:", insertResult.insertedId);

    // ✅ Create task in tasks collection (optional)
    let taskId = null;
    try {
      const taskDoc = {
        title: `${service} - ${customerName}`,
        status: "todo",
        date: startISO,
        createdAt: new Date(),
        calendarEventId: eventId,
        meetLink: meetLink,
        attendeeEmail: attendeeEmail,
        businessId: businessId || "",
      };

      const taskResult = await db.collection("tasks").insertOne(taskDoc);
      taskId = taskResult.insertedId.toString();
      console.log("✅ Task created:", taskId);
    } catch (taskError: any) {
      console.error("⚠️ Failed to create task (non-critical):", taskError.message);
    }

    // ✅ Send custom email via Gmail API
    console.log("📧 Sending confirmation email via Gmail...");

    const startDate = new Date(startISO);
    const endDate = new Date(endISO);
    
    const formatDate = (date: Date) => {
      return date.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
    };

    const formattedDate = formatDate(startDate);
    const formattedEndTime = endDate.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });

    // Calculate duration
    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .event-details { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .event-details h2 { margin: 0 0 15px 0; color: #667eea; font-size: 20px; }
    .detail-row { margin: 12px 0; font-size: 15px; }
    .detail-row strong { color: #495057; font-weight: 600; display: inline-block; width: 100px; }
    .button { display: inline-block; padding: 14px 32px; background: #667eea; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; font-size: 16px; }
    .button:hover { background: #5568d3; }
    .secondary-link { display: inline-block; margin: 10px 0; color: #667eea; text-decoration: none; font-size: 14px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #6c757d; }
    .divider { height: 1px; background: #dee2e6; margin: 30px 0; }
    .info-box { background: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Appointment Confirmed</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your appointment has been scheduled</p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 25px;">Hi ${customerName}!</p>
      
      <p style="font-size: 16px;">This is to confirm your appointment with <strong>${businessName || "us"}</strong>.</p>
      
      <div class="event-details">
        <h2>📋 Appointment Details</h2>
        <div class="detail-row">
          <strong>Service:</strong> ${service}
        </div>
        <div class="detail-row">
          <strong>When:</strong> ${formattedDate}
        </div>
        <div class="detail-row">
          <strong>Duration:</strong> ${durationMinutes} minutes (until ${formattedEndTime})
        </div>
        ${meetLink ? `<div class="detail-row"><strong>Where:</strong> Google Meet (video call)</div>` : ''}
      </div>

      ${meetLink ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${meetLink}" class="button">🎥 Join Google Meet</a>
        <br>
        <a href="${htmlLink}" class="secondary-link">View in Google Calendar →</a>
      </div>
      ` : `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${htmlLink}" class="secondary-link">View in Google Calendar →</a>
      </div>
      `}

      <div class="info-box">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #0056b3;">📌 Important:</p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>You'll receive calendar reminders 24 hours and 1 hour before</li>
          ${meetLink ? '<li>Click the "Join Google Meet" button above when it\'s time</li>' : ''}
          <li>Need to reschedule? Just reply to this email</li>
        </ul>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6c757d;">
        <strong>Questions?</strong> Reply to this email and we'll get back to you right away.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 5px 0; font-weight: 600; color: #495057;">${businessName || "Our Team"}</p>
      <p style="margin: 5px 0 0 0;">Looking forward to speaking with you!</p>
    </div>
  </div>
</body>
</html>
`;

    const emailLines = [
      `To: ${attendeeEmail}`,
      `From: ${businessName || "Appointment System"} <${googleEmail}>`, // ✅ Use tenant's Gmail
      `Subject: Appointment Confirmation: ${service} - ${formattedDate}`,
      'Content-Type: text/html; charset="UTF-8"',
      'MIME-Version: 1.0',
      '',
      emailHtml,
    ];

    const email = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    let emailSent = false;
    let emailId = null;

    try {
      const emailResult = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      });

      emailId = emailResult.data.id;
      emailSent = true;
      console.log("✅ Confirmation email sent via Gmail:", emailId);
    } catch (gmailError: any) {
      console.error("⚠️ Gmail send failed (non-critical):", gmailError.message);
      console.error("Gmail error details:", gmailError);
      // Don't fail the whole request if email fails
    }

    // ✅ Return success response
    return NextResponse.json({
      success: true,
      eventId,
      appointmentId: insertResult.insertedId.toString(),
      taskId,
      meetLink,
      htmlLink,
      emailSent,
      emailId,
      message: `Appointment booked successfully${emailSent ? ' and confirmation email sent' : ' (email failed to send)'}`,
    });

  } catch (err: any) {
    console.error("❌ Calendar booking error:", err?.message || err);
    return NextResponse.json(
      { 
        success: false, 
        error: err?.message || "Failed to book appointment" 
      },
      { status: 500 }
    );
  }
}