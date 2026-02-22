import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    return NextResponse.json({ error: "Missing GOOGLE_REFRESH_TOKEN" }, { status: 500 });
  }

  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const resp = await calendar.calendarList.list();
  const items = (resp.data.items || []).map((c) => ({
    id: c.id,
    summary: c.summary,
    primary: c.primary,
  }));

  return NextResponse.json({ calendars: items });
}
