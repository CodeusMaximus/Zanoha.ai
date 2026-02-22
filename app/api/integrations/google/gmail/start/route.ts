import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { getDb } from "@/lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";

export const runtime = "nodejs";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  // "https://www.googleapis.com/auth/gmail.modify", // optional later
];

export async function GET() {
  const { userId } = await auth();

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const biz = await getOrCreateBusiness();
  const db = await getDb();

  // OAuth state stored in DB (10 min TTL recommended)
  const state = crypto.randomBytes(24).toString("hex");
  await db.collection("oauth_states").insertOne({
    state,
    provider: "google",
    businessId: biz._id.toString(),
    purpose: "gmail_scopes",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    createdAt: new Date(),
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI_GMAIL!, // set below
    response_type: "code",

    // ✅ incremental auth: add scopes without breaking existing ones
    scope: GMAIL_SCOPES.join(" "),
    include_granted_scopes: "true",

    // ✅ key for getting refresh tokens reliably (esp if they already connected calendar)
    access_type: "offline",
    prompt: "consent",

    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(url);
}
