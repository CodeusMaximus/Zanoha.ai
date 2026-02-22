import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    
    const callSid = (form.get("CallSid") as string) || "";
    const callStatus = (form.get("CallStatus") as string) || "";
    const callDuration = form.get("CallDuration") as string;

    console.log(`📊 Call status update: ${callSid} → ${callStatus}`);

    // ✅ Update database
    await fetch(`${process.env.PUBLIC_BASE_URL}/api/calls/update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callSid,
        status: callStatus,
        duration: callDuration
      })
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error updating call status:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}