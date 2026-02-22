import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";

export const runtime = "nodejs";

export async function GET() {
  try {
    const biz = await getOrCreateBusiness();
    const db = await getDb();

    const businessId = biz._id.toString();

    const doc = await db.collection("business_twilio").findOne({ businessId });

    return NextResponse.json({
      connected: true, // Twilio is "connected" because you're the master account
      phoneNumber: doc?.phoneNumber || "",
      phoneNumberSid: doc?.phoneNumberSid || "",
      areaCode: doc?.areaCode || "",
      forwardingEnabled: !!doc?.forwardingEnabled,
      forwardingNumber: doc?.forwardingNumber || "",
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
