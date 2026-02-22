import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";

export const runtime = "nodejs";

function isE164(n: string) {
  return /^\+\d{10,15}$/.test(n);
}

export async function POST(req: Request) {
  try {
    const biz = await getOrCreateBusiness();
    const db = await getDb();
    const businessId = biz._id.toString();

    const body = await req.json();
    const enabled = !!body?.enabled;
    const forwardingNumber = String(body?.forwardingNumber || "").trim();

    if (enabled && !isE164(forwardingNumber)) {
      return NextResponse.json(
        { error: "Forwarding number must be E.164 format, e.g. +13475551234" },
        { status: 400 }
      );
    }

    await db.collection("business_twilio").updateOne(
      { businessId },
      {
        $set: {
          forwardingEnabled: enabled,
          forwardingNumber: enabled ? forwardingNumber : "",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
