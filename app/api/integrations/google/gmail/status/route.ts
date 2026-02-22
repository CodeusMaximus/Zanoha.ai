import { NextResponse } from "next/server";
import { requireActiveBusinessId } from "@/lib/tenant";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function GET() {
  const { businessId } = await requireActiveBusinessId();
  const db = await getDb();

  const biz = await db.collection("businesses").findOne(
    { _id: new ObjectId(businessId) },
    { projection: { gmailStatus: 1, googleRefreshToken: 1 } }
  );

  const connected = !!biz?.googleRefreshToken && biz?.gmailStatus === "connected";

  return NextResponse.json({ connected });
}
