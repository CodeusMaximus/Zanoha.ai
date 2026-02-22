import { NextResponse } from "next/server";
import twilio from "twilio";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    
    const callSid = (form.get("CallSid") as string) || "";
    const recordingUrl = (form.get("RecordingUrl") as string) || "";
    const recordingSid = (form.get("RecordingSid") as string) || "";
    const recordingDuration = form.get("RecordingDuration") as string;

    console.log(`🎙️ Recording ready: ${callSid}`);

    const mp3Url = recordingUrl ? `${recordingUrl}.mp3` : "";

    // ✅ Save recording to database
    await fetch(`${process.env.PUBLIC_BASE_URL}/api/calls/save-recording`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callSid,
        recordingSid,
        recordingUrl: mp3Url,
        recordingDuration
      })
    });

    // ✅ Trigger transcription
    if (recordingSid) {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      );

      // Type cast to bypass TypeScript error
const recording = client.recordings(recordingSid) as any;
await recording.transcriptions.create({
  transcriptionCallback: `${process.env.PUBLIC_BASE_URL}/api/twilio/transcription`,
  transcriptionCallbackMethod: 'POST'
});

      console.log(`✅ Transcription requested for ${callSid}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error saving recording:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}