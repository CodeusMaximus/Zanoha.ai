import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireActiveBusinessId } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { businessId } = await requireActiveBusinessId();
  const { searchParams } = new URL(req.url);

  // purpose decides what scopes we ask for
  const purpose = (searchParams.get("purpose") || "calendar").toLowerCase();
  // where to send user after callback
  const next = searchParams.get("next") || "/dashboard/calendar";

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return NextResponse.json(
      { ok: false, error: "Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI" },
      { status: 500 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  // ✅ store businessId + purpose + next so callback knows what to do
  const state = Buffer.from(JSON.stringify({ businessId, purpose, next })).toString("base64url");

  const baseScopes = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  const calendarScopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const gmailScopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
  ];

  const scopes =
    purpose === "gmail"
      ? [...baseScopes, ...gmailScopes]
      : [...baseScopes, ...calendarScopes];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: scopes,
    state,
  });

  return NextResponse.redirect(url);
}
