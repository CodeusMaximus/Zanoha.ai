import { NextRequest, NextResponse } from "next/server";
import { requireActiveBusinessId } from "@/lib/tenant";
import {
  getCalendarClientForBusiness,
  getOrCreateCalendarForBusiness,
  // markGoogleReauthRequiredForBusiness,
} from "@/lib/calendar-helpers";

export const runtime = "nodejs";

function normalizeGoogleError(err: any) {
  const message = String(err?.message || "");
  const status = err?.response?.status || err?.status;
  const data = err?.response?.data;

  const errorText =
    String(data?.error_description || data?.error || "") || message;

  const isInvalidGrant =
    message.toLowerCase().includes("invalid_grant") ||
    errorText.toLowerCase().includes("invalid_grant") ||
    errorText.toLowerCase().includes("expired") ||
    errorText.toLowerCase().includes("revoked") ||
    String(data?.error).toLowerCase() === "invalid_grant";

  const isReauthRequired =
    isInvalidGrant ||
    message.toLowerCase().includes("google_reauth_required") ||
    errorText.toLowerCase().includes("google_reauth_required");

  return {
    isInvalidGrant,
    isReauthRequired,
    status: status ?? null,
    errorText: errorText || message || "Unknown error",
  };
}

export async function GET(req: NextRequest) {
  // Auth
  let businessId = "";
  try {
    const r = await requireActiveBusinessId();
    businessId = String(r?.businessId || "");
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get("timeMin");
  const timeMax = searchParams.get("timeMax");

  if (!timeMin || !timeMax) {
    return NextResponse.json(
      { success: false, error: "Missing timeMin/timeMax" },
      { status: 400 }
    );
  }

  try {
    // 🎯 Auto-create or find calendar for this tenant
    const calendarId = await getOrCreateCalendarForBusiness(businessId);

    // ✅ Tenant-scoped Google client (loads refresh token from DB for this business)
    const calendar = await getCalendarClientForBusiness(businessId);

    const resp = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
      fields:
        "items(id,summary,start,end,hangoutLink,conferenceData,htmlLink,description,attendees,status)",
    });

    const items = resp.data.items || [];

    const events = items.map((e: any) => ({
      id: e.id || "",
      title: e.summary || "Untitled",
      start: e.start?.dateTime || e.start?.date || null,
      end: e.end?.dateTime || e.end?.date || null,
      meetLink:
        e.hangoutLink || e.conferenceData?.entryPoints?.[0]?.uri || null,
      htmlLink: e.htmlLink || null,
      attendees: (e.attendees || [])
        .map((a: any) => a.email)
        .filter(Boolean),
      description: e.description || "",
      status: e.status || "",
    }));

    return NextResponse.json({
      success: true,
      events,
      businessId,
    });
  } catch (err: any) {
    const norm = normalizeGoogleError(err);

    // 🔥 Handle dead/expired refresh token OR missing refresh token (reauth required)
    if (norm.isReauthRequired) {
      console.error(
        "get-events error: reauth required for business",
        businessId,
        norm.errorText
      );

      // Optional: mark tenant status + clear stored refresh token (recommended)
      // try {
      //   await markGoogleReauthRequiredForBusiness(businessId);
      // } catch (e) {
      //   console.warn("Failed to mark reauth required:", e);
      // }

      return NextResponse.json(
        {
          success: false,
          error: "google_reauth_required",
          message: "Google connection expired or was revoked. Please reconnect.",
        },
        { status: 401 }
      );
    }

    console.error("get-events error:", norm.errorText);
    return NextResponse.json(
      { success: false, error: norm.errorText || "Failed to fetch events" },
      { status: 500 }
    );
  }
}
