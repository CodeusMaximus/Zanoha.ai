import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { connectToDatabase } from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

const TASKS_COLLECTION = "tasks";

/**
 * Send a reminder email for a scheduled meeting
 * POST /api/tasks/[id]/remind
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get task from database
    const { db } = await connectToDatabase();
    const task = await db
      .collection(TASKS_COLLECTION)
      .findOne({ _id: new ObjectId(id) });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if it's a calendar booking with email
    if (!task.attendeeEmail || !task.meetLink) {
      return NextResponse.json(
        { error: "Task is not a calendar booking or missing attendee email" },
        { status: 400 }
      );
    }

    // Initialize Gmail API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refreshToken) {
      return NextResponse.json(
        { error: "Missing GOOGLE_REFRESH_TOKEN" },
        { status: 500 }
      );
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Format the meeting date/time
    const meetingDate = new Date(task.date);
    const formattedDate = meetingDate.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });

    // Calculate time until meeting
    const now = new Date();
    const hoursUntil = Math.round((meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    // Create reminder email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .reminder-box { background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .reminder-box h2 { margin: 0 0 10px 0; color: #856404; font-size: 20px; }
    .time-remaining { font-size: 32px; font-weight: bold; color: #856404; margin: 10px 0; }
    .meeting-details { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .detail-row { margin: 12px 0; font-size: 15px; }
    .detail-row strong { color: #495057; font-weight: 600; display: inline-block; width: 80px; }
    .button { display: inline-block; padding: 14px 32px; background: #667eea; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; font-size: 16px; }
    .button:hover { background: #5568d3; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Meeting Reminder</h1>
    </div>
    
    <div class="content">
      <div class="reminder-box">
        <h2>Your meeting is coming up!</h2>
        <div class="time-remaining">${hoursUntil > 0 ? `In ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}` : 'Starting soon!'}</div>
      </div>

      <p style="font-size: 16px;">This is a friendly reminder about your upcoming discovery call with <strong>MediaDari</strong>.</p>
      
      <div class="meeting-details">
        <h3 style="margin: 0 0 15px 0; color: #667eea;">📋 Meeting Details</h3>
        <div class="detail-row">
          <strong>Title:</strong> ${task.title}
        </div>
        <div class="detail-row">
          <strong>When:</strong> ${formattedDate}
        </div>
        <div class="detail-row">
          <strong>Duration:</strong> 30 minutes
        </div>
        <div class="detail-row">
          <strong>Where:</strong> Google Meet (video call)
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${task.meetLink}" class="button">🎥 Join Google Meet Now</a>
      </div>

      <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #0056b3;">💡 Meeting Preparation:</p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>Have your questions ready about website development</li>
          <li>Think about your business goals and online presence needs</li>
          <li>Prepare any specific features or functionality you'd like</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
        <strong>Need to reschedule?</strong> Just reply to this email and we'll work out a better time.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 5px 0; font-weight: 600; color: #495057;">MediaDari</p>
      <p style="margin: 0;">Digital Media & Web Agency</p>
      <p style="margin: 5px 0 0 0;">Staten Island, NY</p>
    </div>
  </div>
</body>
</html>
`;

    // Construct email
    const emailLines = [
      `To: ${task.attendeeEmail}`,
      `From: MediaDari <dfsturge@gmail.com>`,
      `Subject: ⏰ Reminder: Meeting in ${hoursUntil > 0 ? hoursUntil + ' hours' : 'less than 1 hour'} - ${task.title}`,
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

    // Send email
    const emailResult = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    console.log("✅ Reminder sent:", emailResult.data.id);

    // Update task to track that reminder was sent
    await db.collection(TASKS_COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastReminderSent: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      success: true,
      emailId: emailResult.data.id,
      message: `Reminder sent to ${task.attendeeEmail}`,
      hoursUntilMeeting: hoursUntil,
    });

  } catch (error: any) {
    console.error("❌ Error sending reminder:", error);
    return NextResponse.json(
      {
        error: "Failed to send reminder",
        details: error.message,
      },
      { status: 500 }
    );
  }
}