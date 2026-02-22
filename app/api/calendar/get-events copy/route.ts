// app/api/calendar/get-events/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs"; // googleapis needs node runtime

function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const refresh = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refresh) throw new Error("Missing GOOGLE_REFRESH_TOKEN");

  oauth2Client.setCredentials({ refresh_token: refresh });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const timeMin = searchParams.get("timeMin");
    const timeMax = searchParams.get("timeMax");

    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { success: false, error: "Missing timeMin or timeMax" },
        { status: 400 }
      );
    }

    const calendar = getCalendarClient();

    const resp = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    const items = resp.data.items ?? [];

    const events = items
      .filter((e) => e.start?.dateTime || e.start?.date) // dateTime for timed, date for all-day
      .map((e) => {
        const startRaw = e.start?.dateTime ?? e.start?.date!;
        const endRaw = e.end?.dateTime ?? e.end?.date ?? startRaw;

        const meetLink =
          e.hangoutLink ||
          (e.conferenceData?.entryPoints || []).find((p) => p.entryPointType === "video")
            ?.uri ||
          undefined;

        const attendees = (e.attendees || [])
          .map((a) => a.email)
          .filter(Boolean) as string[];

        return {
          id: e.id,
          title: e.summary || "(No title)",
          start: startRaw,
          end: endRaw,
          description: e.description || "",
          meetLink,
          attendees,
          status: e.status || "",
          htmlLink: e.htmlLink || "",
        };
      });

    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    console.error("get-events error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
