import { NextResponse } from "next/server";
import { getOrCreateBusiness } from "@/lib/business";
import {
  getOrCreateTenantSubaccount,
  getTenantTwilioClient,
} from "@/lib/twilio";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const biz = await getOrCreateBusiness();
    const businessId = biz._id.toString();

    const body = await req.json();
    const areaCode = String(body?.areaCode || "").replace(/\D/g, "").slice(0, 3);
    const limit = Math.min(20, Math.max(5, Number(body?.limit) || 12));

    if (!/^\d{3}$/.test(areaCode)) {
      return NextResponse.json({ error: "Invalid area code" }, { status: 400 });
    }

    const subSid = await getOrCreateTenantSubaccount(businessId);
    const tenant = getTenantTwilioClient(subSid);

    const numbers = await tenant.availablePhoneNumbers("US").local.list({
      areaCode: Number(areaCode),
      limit,
      voiceEnabled: true,
    });

    return NextResponse.json({
      numbers: numbers.map((n) => ({
        phoneNumber: n.phoneNumber,
        friendlyName: n.friendlyName,
        locality: n.locality,
        region: n.region,
        postalCode: n.postalCode,
      })),
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
