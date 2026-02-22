import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getDb } from "@/lib/mongodb";
import { decryptText, encryptText } from "../../../../../../lib/tokenCrypto"; // if you already have encryption, use it

export const runtime = "nodejs";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) return NextResponse.redirect(`/dashboard/integrations?error=${encodeURIComponent(err)}`);
  if (!code || !state) return NextResponse.json({ error: "Missing code/state" }, { status: 400 });

  const db = await getDb();

  // validate + consume state
  const st = await db.collection("oauth_states").findOneAndDelete({ state, provider: "google" });
  if (!st?.value) return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  if (new Date(st.value.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "State expired" }, { status: 400 });
  }

  const businessId = st.value.businessId as string;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI_GMAIL!
  );

  const tokenResp = await oauth2Client.getToken(code);
  const tokens = tokenResp.tokens;

  if (!tokens.access_token) throw new Error("No access_token returned by Google");

  // Fetch email address (nice for UI)
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: "me" });
  const emailAddress = profile.data.emailAddress || "unknown";

  const expiresAt = new Date(tokens.expiry_date ?? Date.now() + 3600_000);

  // ✅ IMPORTANT:
  // If the user already authorized Calendar earlier, Google may NOT return refresh_token every time.
  // But because we used prompt=consent + access_type=offline, it usually will.
  // Still: only overwrite refresh token if Google actually gave us one.
  const refreshToken = tokens.refresh_token;

  // ---- STORE UNDER YOUR EXISTING GOOGLE CONNECTION RECORD ----
  // Use whatever collection you already use for Google Calendar tokens.
  // I’ll assume you store per tenant like: oauth_connections { businessId, provider: "google", refreshTokenEnc, scopes[] ... }
  const existing = await db.collection("oauth_connections").findOne({ businessId, provider: "google" });

  const mergedScopes = Array.from(
    new Set([...(existing?.scopes || []), ...GMAIL_SCOPES])
  );

  await db.collection("oauth_connections").updateOne(
    { businessId, provider: "google" },
    {
      $set: {
        businessId,
        provider: "google",
        googleEmail: emailAddress,
        scopes: mergedScopes,
        accessTokenEnc: encryptText(tokens.access_token),
        expiresAt,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
      ...(refreshToken
        ? { $set: { refreshTokenEnc: encryptText(refreshToken) } }
        : {}),
    },
    { upsert: true }
  );

  // also keep an easy “email inbox connected” view if you want
  await db.collection("email_connections").updateOne(
    { businessId, provider: "gmail" },
    {
      $set: {
        businessId,
        provider: "gmail",
        emailAddress,
        status: "connected",
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return NextResponse.redirect(`/dashboard/integrations?connected=gmail`);
}
