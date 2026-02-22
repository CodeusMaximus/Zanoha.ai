import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";

export const runtime = "nodejs";

export async function GET() {
  const biz = await getOrCreateBusiness();
  const db = await getDb();

  const tok = await db.collection("integration_tokens").findOne({
    provider: "hubspot",
    businessId: biz._id.toString(),
  });

  if (!tok?.accessToken) {
    return NextResponse.json({ error: "HubSpot not connected" }, { status: 401 });
  }

  const r = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=20", {
    headers: { Authorization: `Bearer ${tok.accessToken}` },
    cache: "no-store",
  });

  const data = await r.json();
  if (!r.ok) return NextResponse.json({ error: data }, { status: 400 });

  return NextResponse.json({ results: data?.results || [] });
}
