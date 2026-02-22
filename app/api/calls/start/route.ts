import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, leadId, businessName, phone, name } = body;

    // ✅ ADD THIS DEBUG
    console.log("📦 Full request body:", body);
    console.log("🔍 Extracted values:", { to, leadId, businessName, phone, name });
    console.log("🚨 leadId is:", leadId, "type:", typeof leadId);

    if (!to) {
      return NextResponse.json({ success: false, error: "Missing to" }, { status: 400 });
    }

    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER,
      PUBLIC_BASE_URL,
    } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER || !PUBLIC_BASE_URL) {
      return NextResponse.json(
        { success: false, error: "Missing env vars" },
        { status: 500 }
      );
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    console.log("🔵 Creating Twilio call to:", to);

    // ✅ Build URL and log it
    const streamUrl = `${PUBLIC_BASE_URL}/api/twilio/stream?leadId=${encodeURIComponent(leadId || "")}&businessName=${encodeURIComponent(businessName || name || "")}&contactName=${encodeURIComponent("")}`;
    console.log("🔗 Stream URL being sent to Twilio:", streamUrl);

    const call = await client.calls.create({
      to,
      from: TWILIO_PHONE_NUMBER,
      url: streamUrl,
      method: "POST",

      record: true,
      recordingStatusCallback: `${PUBLIC_BASE_URL}/api/twilio/recording`,
      recordingStatusCallbackMethod: "POST",

      statusCallback: `${PUBLIC_BASE_URL}/api/twilio/status`,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    });

    console.log("✅ Call created! SID:", call.sid);

    // Log to database
    try {
      await fetch(`${PUBLIC_BASE_URL}/api/calls/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callSid: call.sid,
          leadId: leadId || "unknown",
          businessName: businessName || name || "Unknown",
          phone: to,
          userId: "system"
        })
      });
      console.log("✅ Call logged to database");
    } catch (logError) {
      console.error("⚠️ Failed to log call:", logError);
    }

    return NextResponse.json({ 
      success: true, 
      callSid: call.sid,
      call_sid: call.sid
    });
  } catch (e: any) {
    console.error("❌ Error creating call:", e);
    return NextResponse.json({ 
      success: false, 
      error: e?.message || "Unknown" 
    }, { status: 500 });
  }
}