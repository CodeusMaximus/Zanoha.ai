import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/IntegrationsPage?error=${encodeURIComponent(errorDesc || error)}`,
        url.origin
      )
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/dashboard/IntegrationsPage?error=missing_code_or_state`, url.origin)
    );
  }

  const db = await getDb();
  const stateDoc = await db.collection("oauth_states").findOne({ state, provider: "salesforce" });
  if (!stateDoc) {
    return NextResponse.redirect(new URL(`/dashboard/IntegrationsPage?error=invalid_state`, url.origin));
  }
  await db.collection("oauth_states").deleteOne({ _id: stateDoc._id });

  const clientId = mustEnv("SALESFORCE_CLIENT_ID");
  const clientSecret = mustEnv("SALESFORCE_CLIENT_SECRET");
  const redirectUri = mustEnv("SALESFORCE_REDIRECT_URI");
  const loginBase = process.env.SALESFORCE_LOGIN_BASE || "https://login.salesforce.com";

  // Token exchange endpoint :contentReference[oaicite:5]{index=5}
  const tokenUrl = new URL("/services/oauth2/token", loginBase);

  const tokenRes = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/IntegrationsPage?error=${encodeURIComponent(tokenJson?.error_description || "salesforce_token_failed")}`,
        url.origin
      )
    );
  }

  const accessToken = tokenJson.access_token as string;
  const refreshToken = tokenJson.refresh_token as string | undefined;
  const instanceUrl = tokenJson.instance_url as string | undefined;
  const idUrl = tokenJson.id as string | undefined;

  // Try to parse org/user from idUrl: .../id/{orgId}/{userId}
  let orgId: string | undefined;
  let userId: string | undefined;
  if (idUrl) {
    const parts = idUrl.split("/id/")[1]?.split("/") || [];
    orgId = parts[0];
    userId = parts[1];
  }

  const businessId = stateDoc.businessId as string;
  const now = new Date();

  await db.collection("integration_tokens").updateOne(
    { provider: "salesforce", businessId },
    {
      $set: {
        provider: "salesforce",
        businessId,
        accessToken,
        refreshToken,
        meta: { instanceUrl, idUrl, orgId, userId },
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  const next = (stateDoc.next as string) || "/dashboard/IntegrationsPage";
  const redirect = new URL(next, url.origin);
  redirect.searchParams.set("connected", "salesforce");
  return NextResponse.redirect(redirect);
}
