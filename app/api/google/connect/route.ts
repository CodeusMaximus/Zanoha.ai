import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireActiveBusinessId } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { businessId } = await requireActiveBusinessId();

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const state = Buffer.from(JSON.stringify({ businessId })).toString("base64url");

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/gmail.send", // ✅ ADD GMAIL
      "https://www.googleapis.com/auth/userinfo.email", // ✅ Get user's email
    ],
    state,
  });

  return NextResponse.redirect(authUrl);
}