import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { google } from "googleapis";
import { ObjectId } from "mongodb";
import { requireActiveBusinessId } from "@/lib/tenant";

export const runtime = "nodejs";

function getCalendarClient() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
  } = process.env;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function POST(req: NextRequest) {
  try {
    const { businessId } = await requireActiveBusinessId();
    const { appointmentId, googleEventId } = await req.json();

    const db = await getDb();

    // ✅ Delete from Mongo only within this tenant
    if (appointmentId && ObjectId.isValid(appointmentId)) {
      await db.collection("appointments").deleteOne({
        _id: new ObjectId(appointmentId),
        businessId,
      });
    }

    // ⚠️ Google delete is still global until you go per-tenant Google (see below)
    if (googleEventId) {
      try {
        const calendar = getCalendarClient();
        const calendarId = process.env.GOOGLE_CALENDAR_ID || "";

        await calendar.events.delete({
          calendarId,
          eventId: googleEventId,
          sendUpdates: "all",
        });
      } catch (err: any) {
        console.error("⚠️ Google Calendar delete failed:", err.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Delete failed" },
      { status: 500 }
    );
  }
}
