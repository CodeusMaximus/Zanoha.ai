import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/dashboard/IntegrationsPage";

  const clientId = mustEnv("SALESFORCE_CLIENT_ID");
  const redirectUri = mustEnv("SALESFORCE_REDIRECT_URI");
  const loginBase = process.env.SALESFORCE_LOGIN_BASE || "https://login.salesforce.com";

  const biz = await getOrCreateBusiness();
  const db = await getDb();

  const state = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.collection("oauth_states").insertOne({
    state,
    provider: "salesforce",
    businessId: biz._id.toString(),
    next,
    expiresAt,
  });

  // Salesforce OAuth Web Server Flow :contentReference[oaicite:4]{index=4}
  const authUrl = new URL("/services/oauth2/authorize", loginBase);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  // scopes: "refresh_token" is requested via "offline_access" in some contexts,
  // Salesforce commonly uses "refresh_token" or "offline_access" depending on org config.
  // We'll request full + refresh token ability:
  authUrl.searchParams.set("scope", "api refresh_token");

  return NextResponse.redirect(authUrl.toString());
}
