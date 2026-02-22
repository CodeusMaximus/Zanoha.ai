import { NextResponse } from "next/server";
import twilio from "twilio";

export const runtime = "nodejs";

async function handleVoice(req: Request) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId") || "";

  const baseUrl = process.env.PUBLIC_BASE_URL!;
  const pythonApi = process.env.PYTHON_API_URL || "http://localhost:5000";
  const twiml = new twilio.twiml.VoiceResponse();

  // TODO (recommended): fetch lead data from your DB here using leadId
  // For now, we’ll fall back if you don’t have it available yet.
  const lead = {
    businessName: searchParams.get("businessName") || "", // or from DB
    city: searchParams.get("city") || "your area",
  };

  try {
    console.log("📞 Starting call, calling Python API (VERIFY opener)...");

    const response = await fetch(`${pythonApi}/jennifer/next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: leadId || "default",
        // CHANGED: this tells your python side “start with verification”
        intent: "VERIFY",
        lead,
        userText: "[VERIFY_START]",
      }),
    });

    console.log("📥 Python response status:", response.status);

    const data = await response.json();
    console.log("📦 Python response data:", data);

    if (data.audioUrl) {
      const filename = data.audioUrl.split("/").pop();
      const publicAudioUrl = `${baseUrl}/api/python-audio/${filename}`;
      console.log("🔊 Playing audio via:", publicAudioUrl);
      twiml.play(publicAudioUrl);
    } else {
      console.log("⚠️ No audioUrl, using fallback verification line");
      twiml.say(
        { voice: "alice" },
        `Hi—just making sure I’ve got the right place. Is this ${lead.businessName || "your business"} in ${lead.city}?`
      );
    }
  } catch (error) {
    console.error("❌ Python API error:", error);
    twiml.say(
      { voice: "alice" },
      `Hi—just making sure I’ve got the right place. Is this ${lead.businessName || "your business"} in ${lead.city}?`
    );
  }

  // Gather AFTER the verification question (good)
  twiml.gather({
    input: ["speech"],
    action: `${baseUrl}/api/twilio/gather?leadId=${encodeURIComponent(leadId)}`,
    method: "POST",
    timeout: 5,
    speechTimeout: "auto",
  });

  // Keep your fallback exit
  twiml.say({ voice: "alice" }, "No worries. Have a great day.");
  twiml.hangup();

  const twimlString = twiml.toString();
  console.log("📤 Returning TwiML:", twimlString);

  return new NextResponse(twimlString, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
    },
  });
}

export async function POST(req: Request) {
  return handleVoice(req);
}
export async function GET(req: Request) {
  return handleVoice(req);
}
