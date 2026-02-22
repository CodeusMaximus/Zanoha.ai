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

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/IntegrationsPage?error=${encodeURIComponent(error)}`, url.origin)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/dashboard/IntegrationsPage?error=missing_code_or_state`, url.origin)
    );
  }

  const db = await getDb();
  const stateDoc = await db.collection("oauth_states").findOne({ state, provider: "hubspot" });

  if (!stateDoc) {
    return NextResponse.redirect(
      new URL(`/dashboard/IntegrationsPage?error=invalid_state`, url.origin)
    );
  }

  // consume state
  await db.collection("oauth_states").deleteOne({ _id: stateDoc._id });

  const clientId = mustEnv("HUBSPOT_CLIENT_ID");
  const clientSecret = mustEnv("HUBSPOT_CLIENT_SECRET");
  const redirectUri = mustEnv("HUBSPOT_REDIRECT_URI");

  // Exchange code for tokens
  // HubSpot OAuth docs :contentReference[oaicite:3]{index=3}
  const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
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
        `/dashboard/IntegrationsPage?error=${encodeURIComponent(tokenJson?.message || "hubspot_token_failed")}`,
        url.origin
      )
    );
  }

  const accessToken = tokenJson.access_token as string;
  const refreshToken = tokenJson.refresh_token as string | undefined;
  const expiresIn = Number(tokenJson.expires_in || 0);

  // Optional: identify portal/account
  let hubId: number | undefined;
  try {
    const infoRes = await fetch("https://api.hubapi.com/oauth/v1/access-tokens/" + accessToken, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const info = await infoRes.json();
    hubId = info?.hub_id;
  } catch {
    // ignore
  }

  const businessId = stateDoc.businessId as string;
  const now = new Date();
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;

  await db.collection("integration_tokens").updateOne(
    { provider: "hubspot", businessId },
    {
      $set: {
        provider: "hubspot",
        businessId,
        accessToken,
        refreshToken,
        expiresAt,
        meta: { hubId },
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  const next = (stateDoc.next as string) || "/dashboard/IntegrationsPage";
  const redirect = new URL(next, url.origin);
  redirect.searchParams.set("connected", "hubspot");
  return NextResponse.redirect(redirect);
}
