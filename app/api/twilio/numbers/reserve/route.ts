import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";
import {
  getOrCreateTenantSubaccount,
  getTenantTwilioClient,
} from "@/lib/twilio";

export const runtime = "nodejs";

function isE164US(n: string) {
  // basic +1XXXXXXXXXX
  return /^\+1\d{10}$/.test(n);
}

export async function POST(req: Request) {
  try {
    const biz = await getOrCreateBusiness();
    const db = await getDb();

    const businessId = biz._id.toString();
    const body = await req.json();

    const phoneNumber = String(body?.phoneNumber || "").trim();
    const areaCode = String(body?.areaCode || "").replace(/\D/g, "").slice(0, 3);

    if (!isE164US(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number (expected E.164 like +17181234567)" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.TWILIO_APP_BASE_URL;
    if (!baseUrl) throw new Error("Missing TWILIO_APP_BASE_URL");

    // The webhook Twilio will hit when someone calls the number
    const voiceUrl = `${baseUrl}/api/twilio/voice/inbound?businessId=${businessId}`;

    const subSid = await getOrCreateTenantSubaccount(businessId);
    const tenant = getTenantTwilioClient(subSid);

    // Purchase number in the tenant subaccount
    const purchased = await tenant.incomingPhoneNumbers.create({
      phoneNumber,
      voiceUrl,
      voiceMethod: "POST",
    });

    await db.collection("business_twilio").updateOne(
      { businessId },
      {
        $set: {
          businessId,
          twilioSubaccountSid: subSid,
          phoneNumber: purchased.phoneNumber,
          phoneNumberSid: purchased.sid,
          voiceWebhookUrl: voiceUrl,
          areaCode: /^\d{3}$/.test(areaCode) ? areaCode : "",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({
      ok: true,
      phoneNumber: purchased.phoneNumber,
      phoneNumberSid: purchased.sid,
      voiceUrl,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
