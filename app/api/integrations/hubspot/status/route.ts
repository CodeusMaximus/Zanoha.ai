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

  return NextResponse.json({
    connected: !!tok?.accessToken,
    meta: tok?.meta || null,
  });
}
