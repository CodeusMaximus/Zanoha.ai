import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    console.log("🧪 Starting Google Calendar email test...");

    // ✅ Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    console.log("Environment check:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken,
      clientIdPreview: clientId?.substring(0, 20) + "...",
    });

    if (!refreshToken) {
      return NextResponse.json({
        error: "GOOGLE_REFRESH_TOKEN not found in environment",
        fix: "Visit /api/google/auth to get a refresh token",
      }, { status: 500 });
    }

    // ✅ Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, process.env.GOOGLE_REDIRECT_URI);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // ✅ Initialize Calendar API
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // ✅ Get calendar info
    const calendarInfo = await calendar.calendars.get({ calendarId: 'primary' });
    const organizerEmail = calendarInfo.data.id;

    console.log("📧 Calendar owner email:", organizerEmail);

    // ✅ Check calendar settings
    const settings = await calendar.settings.list();
    const emailSettings = settings.data.items?.filter(s => s.id?.includes('notification') || s.id?.includes('email'));
    
    console.log("Calendar settings related to email:", emailSettings);

    // ✅ Create a test event - HARDCODED TEST EMAIL
    const testAttendeeEmail = "cityphysique@gmail.com"; // ← CHANGE THIS TO YOUR PERSONAL EMAIL
    
    console.log("\n🎯 Creating test event with:");
    console.log("Organizer:", organizerEmail);
    console.log("Attendee:", testAttendeeEmail);
    console.log("Same email?", organizerEmail === testAttendeeEmail);

    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 min later

    const event = {
      summary: "🧪 TEST EVENT - Calendar Email Test",
      description: "This is a test event to verify calendar email sending works. If you receive this, emails are working!",
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "America/New_York",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "America/New_York",
      },
      attendees: [
        {
          email: testAttendeeEmail,
          displayName: "Test Attendee",
          responseStatus: "needsAction",
        },
      ],
      conferenceData: {
        createRequest: {
          requestId: `test-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
        ],
      },
      guestsCanSeeOtherGuests: true,
    };

    console.log("\n📤 Inserting event with:");
    console.log("- sendUpdates: all");
    console.log("- sendNotifications: true");
    console.log("- conferenceDataVersion: 1");

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: "all",
      sendNotifications: true,
      requestBody: event,
    });

    const createdEvent = response.data;
    
    console.log("\n✅ Event created!");
    console.log("Event ID:", createdEvent.id);
    console.log("HTML Link:", createdEvent.htmlLink);
    console.log("Organizer:", createdEvent.organizer);
    console.log("Attendees:", createdEvent.attendees);
    console.log("Status:", createdEvent.status);

    return NextResponse.json({
      success: true,
      message: "Test event created! Check the logs and the attendee's email.",
      organizerEmail,
      testAttendeeEmail,
      sameEmail: organizerEmail === testAttendeeEmail,
      eventDetails: {
        id: createdEvent.id,
        htmlLink: createdEvent.htmlLink,
        hangoutLink: createdEvent.hangoutLink,
        organizer: createdEvent.organizer,
        attendees: createdEvent.attendees,
        status: createdEvent.status,
        created: createdEvent.created,
      },
      instructions: organizerEmail === testAttendeeEmail
        ? "⚠️ WARNING: Organizer and attendee are THE SAME. Google will NOT send an email. Change testAttendeeEmail in the code to a DIFFERENT email address."
        : "✅ Organizer and attendee are different. Email should be sent. Check spam folder if not received in 2-3 minutes.",
      nextSteps: [
        "1. Check the attendee email's inbox (and spam folder)",
        "2. Wait 2-3 minutes for email delivery",
        "3. Verify event shows in Google Calendar web UI at calendar.google.com",
        "4. Click the event and verify attendee is listed",
        "5. If still no email, check the calendar settings link below",
      ],
      calendarSettingsUrl: "https://calendar.google.com/calendar/u/0/r/settings",
      emailSettings: emailSettings?.map(s => ({ id: s.id, value: s.value })),
    });

  } catch (error: any) {
    console.error("❌ Test failed:", error);
    
    return NextResponse.json({
      error: "Test failed",
      message: error.message,
      details: error.response?.data || error,
      stack: error.stack,
    }, { status: 500 });
  }
}