import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";

export const runtime = "nodejs";

export async function GET() {
  const db = await getDb();
  const biz = await getOrCreateBusiness();

  const businessId = new ObjectId(biz._id.toString());

  const leads = await db
    .collection("leads")
    .find({ businessId })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({
    leads: leads.map((l) => ({
      ...l,
      _id: l._id.toString(),
      businessId: l.businessId?.toString?.() ?? String(l.businessId),
      createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : null,
    })),
  });
}
