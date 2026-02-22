import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    
    const callSid = (form.get("CallSid") as string) || "";
    const transcriptionText = (form.get("TranscriptionText") as string) || "";
    const transcriptionStatus = (form.get("TranscriptionStatus") as string) || "";

    console.log(`📝 Transcription ready for ${callSid}`);

    // ✅ Save transcription to database
    await fetch(`${process.env.PUBLIC_BASE_URL}/api/calls/save-transcription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callSid,
        transcription: transcriptionText,
        transcriptionStatus
      })
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error saving transcription:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}