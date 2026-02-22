import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

function getCalendarClient() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Missing Google OAuth envs");
  }
  if (!GOOGLE_REFRESH_TOKEN) throw new Error("Missing GOOGLE_REFRESH_TOKEN");

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * GET /api/calendar/diagnostic
 * Shows all calendars and events to help debug
 */
export async function GET() {
  const OLD_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

  try {
    const calendar = getCalendarClient();

    // List all calendars you have access to
    const calendarList = await calendar.calendarList.list();
    const calendars = (calendarList.data.items || []).map((cal) => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary,
    }));

    // Check events in OLD calendar
    let oldCalendarEvents: any[] = [];
    if (OLD_CALENDAR_ID) {
      try {
        const oldEvents = await calendar.events.list({
          calendarId: OLD_CALENDAR_ID,
          timeMin: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // Last 60 days
          timeMax: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // Next 60 days
          singleEvents: true,
          maxResults: 100,
        });
        oldCalendarEvents = (oldEvents.data.items || []).map((e: any) => ({
          id: e.id,
          title: e.summary,
          start: e.start?.dateTime || e.start?.date,
        }));
      } catch (err: any) {
        oldCalendarEvents = [`ERROR: ${err.message}`];
      }
    }

    // Check events in each calendar
    const calendarDetails = [];
    for (const cal of calendars.slice(0, 5)) { // Check first 5 calendars
      try {
        const events = await calendar.events.list({
          calendarId: cal.id!,
          timeMin: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          timeMax: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          singleEvents: true,
          maxResults: 10,
        });

        calendarDetails.push({
          id: cal.id,
          summary: cal.summary,
          description: cal.description,
          eventCount: events.data.items?.length || 0,
          sampleEvents: (events.data.items || []).slice(0, 3).map((e: any) => ({
            title: e.summary,
            start: e.start?.dateTime || e.start?.date,
          })),
        });
      } catch (err: any) {
        calendarDetails.push({
          id: cal.id,
          summary: cal.summary,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      envCalendarId: OLD_CALENDAR_ID || "NOT_SET",
      totalCalendars: calendars.length,
      calendars: calendars,
      oldCalendarEventCount: Array.isArray(oldCalendarEvents) ? oldCalendarEvents.length : 0,
      oldCalendarSampleEvents: oldCalendarEvents,
      calendarDetails,
      instructions: "Check which calendar has your events, then update GOOGLE_CALENDAR_ID accordingly",
    });
  } catch (err: any) {
    console.error("diagnostic error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Diagnostic failed",
      },
      { status: 500 }
    );
  }
}