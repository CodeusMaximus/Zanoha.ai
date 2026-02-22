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

  const clientId = mustEnv("HUBSPOT_CLIENT_ID");
  const redirectUri = mustEnv("HUBSPOT_REDIRECT_URI");

  const biz = await getOrCreateBusiness();
  const db = await getDb();

  const state = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.collection("oauth_states").insertOne({
    state,
    provider: "hubspot",
    businessId: biz._id.toString(),
    next,
    expiresAt,
  });

  // Minimal CRM scopes (contacts). Add more if you want companies/deals/tickets.
  // HubSpot scopes docs: crm.objects.contacts.read/write etc. :contentReference[oaicite:2]{index=2}
  const scope = [
    "crm.objects.contacts.read",
    "crm.objects.contacts.write",
    "oauth",
  ].join(" ");

  const authUrl = new URL("https://app.hubspot.com/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
