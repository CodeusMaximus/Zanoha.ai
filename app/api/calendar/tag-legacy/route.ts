 import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

function isAuthorized(req: Request) {
  const expected = process.env.ADMIN_JOB_SECRET;
  if (!expected) return false;
  const got = req.headers.get("x-admin-secret");
  return got === expected;
}

function getCalendarClient() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Missing Google OAuth envs (CLIENT_ID/SECRET/REDIRECT_URI)");
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

export async function POST(req: NextRequest) {
  // ✅ header secret guard (no Clerk, no tenant)
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get("timeMin");
  const timeMax = searchParams.get("timeMax");

  // ✅ businessId passed explicitly (no tenant context)
  const businessId =
    (searchParams.get("businessId") || "").trim() ||
    (process.env.DEFAULT_BUSINESS_ID || "").trim();

  if (!businessId) {
    return NextResponse.json(
      { ok: false, error: "Missing businessId (query param) or DEFAULT_BUSINESS_ID env" },
      { status: 400 }
    );
  }

  if (!timeMin || !timeMax) {
    return NextResponse.json(
      { ok: false, error: "Missing timeMin/timeMax" },
      { status: 400 }
    );
  }

  const calendarId = (process.env.GOOGLE_CALENDAR_ID || "").trim();
  if (!calendarId) {
    return NextResponse.json({ ok: false, error: "Missing GOOGLE_CALENDAR_ID" }, { status: 500 });
  }

  try {
    const calendar = getCalendarClient();

    const listResp = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
      fields: "items(id,extendedProperties)",
    });

    const items = listResp.data.items || [];

    const eligible = items.filter((e: any) => {
      const bid = e?.extendedProperties?.private?.businessId;
      return !bid; // only tag events that have no businessId yet
    });

    let patched = 0;
    let skipped = 0;
    let errors = 0;

    // Patch sequentially (simple + safe)
    for (const e of eligible) {
      if (!e?.id) {
        skipped++;
        continue;
      }

      try {
        await calendar.events.patch({
          calendarId,
          eventId: e.id,
          requestBody: {
            extendedProperties: {
              private: {
                ...(e?.extendedProperties?.private || {}),
                businessId,
              },
            },
          },
        });

        patched++;
      } catch (err) {
        errors++;
        console.error("tag-legacy patch error:", e?.id, err);
      }
    }

    return NextResponse.json({
      ok: true,
      window: { timeMin, timeMax },
      scanned: items.length,
      eligible: eligible.length,
      patched,
      skipped,
      errors,
      businessId,
    });
  } catch (err: any) {
    console.error("tag-legacy error:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to tag legacy events" },
      { status: 500 }
    );
  }
}
