import { NextResponse } from "next/server";
import twilio from "twilio";

export const runtime = "nodejs";

function toE164(raw: string) {
  const cleaned = String(raw || "").trim().replace(/[^\d+]/g, "");
  // If user sends 10 digits, assume US and prepend +1
  if (/^\d{10}$/.test(cleaned)) return `+1${cleaned}`;
  // If user sends 11 digits starting with 1, prepend +
  if (/^1\d{10}$/.test(cleaned)) return `+${cleaned}`;
  // If it already starts with + and has digits
  if (/^\+\d{8,15}$/.test(cleaned)) return cleaned;
  return cleaned; // fallback (Twilio will complain if invalid)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const customerId = String(body.customerId || "");
    const customerName = String(body.customerName || "");
    const businessId = String(body.businessId || "");
    const toRaw = String(body.to || "");
    const to = toE164(toRaw);

    if (!to) {
      return NextResponse.json({ success: false, error: "Missing phone" }, { status: 400 });
    }

    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER,
      PUBLIC_BASE_URL,
    } = process.env;

    // 🔎 Log what we have (not secrets)
    console.log("📞 call-customer input:", { toRaw, to, customerId, customerName, businessId });
    console.log("🌍 PUBLIC_BASE_URL:", PUBLIC_BASE_URL);

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER || !PUBLIC_BASE_URL) {
      console.error("❌ Missing envs:", {
        hasSid: !!TWILIO_ACCOUNT_SID,
        hasToken: !!TWILIO_AUTH_TOKEN,
        hasFrom: !!TWILIO_PHONE_NUMBER,
        hasPublicBaseUrl: !!PUBLIC_BASE_URL,
      });
      return NextResponse.json(
        { success: false, error: "Missing Twilio env (SID/TOKEN/FROM) or PUBLIC_BASE_URL" },
        { status: 500 }
      );
    }

    // ✅ Twilio must be able to reach this URL (localhost will 100% fail)
    if (!/^https:\/\//i.test(PUBLIC_BASE_URL)) {
      return NextResponse.json(
        { success: false, error: "PUBLIC_BASE_URL must be https and publicly reachable (use ngrok in dev)" },
        { status: 500 }
      );
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const twimlUrl =
      `${PUBLIC_BASE_URL}/api/twilio/stream` +
      `?customerId=${encodeURIComponent(customerId)}` +
      `&customerName=${encodeURIComponent(customerName)}` +
      `&businessId=${encodeURIComponent(businessId)}` +
      `&businessName=${encodeURIComponent(body.businessName || "Your Business")}` +
      `&callType=${encodeURIComponent(body.callType || "customer_outreach")}`;

    console.log("🔗 TwiML URL:", twimlUrl);

    const call = await client.calls.create({
      to,
      from: TWILIO_PHONE_NUMBER,
      url: twimlUrl,
      method: "GET", // ✅ simplest for TwiML URL with querystring
    });

    return NextResponse.json({ success: true, callSid: call.sid });
  } catch (e: any) {
    // Twilio errors often include status/code/moreInfo
    console.error("❌ Call failed:", {
      message: e?.message,
      code: e?.code,
      status: e?.status,
      moreInfo: e?.moreInfo,
    });
    return NextResponse.json(
      { success: false, error: e?.message || "Call failed", code: e?.code, status: e?.status },
      { status: 500 }
    );
  }
}
