import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";

export const runtime = "nodejs";

export async function GET() {
  try {
    const biz = await getOrCreateBusiness();
    const db = await getDb();

    const business = await db.collection("businesses").findOne(
      { _id: biz._id },
      { projection: { businessName: 1, name: 1, logoUrl: 1 } }
    );

    return NextResponse.json({
      ok: true,
      branding: {
        businessName: business?.businessName || business?.name || "Business",
        logoUrl: business?.logoUrl || null,
      },
    });
  } catch (e: any) {
    console.error("GET /api/tenant/branding error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to load branding" },
      { status: 500 }
    );
  }
}
