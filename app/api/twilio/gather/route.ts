import { NextResponse } from "next/server";
import twilio from "twilio";

export const runtime = "nodejs";

function shouldStop(text: string) {
  const t = text.toLowerCase();
  return (
    t.includes("stop") ||
    t.includes("remove") ||
    t.includes("do not call") ||
    t.includes("don't call")
  );
}

// Very lightweight yes/no detector for verification
function verifyAnswer(text: string) {
  const t = text.toLowerCase();

  if (
    /(wrong|no|not|you have the wrong|stop|remove|do not call|don't call|who is this)/.test(t)
  ) return "NO";

  if (/(yes|yeah|yep|correct|right|speaking|this is|you reached|uh-huh|mmhmm)/.test(t))
    return "YES";

  return "UNCLEAR";
}

/**
 * Always prefer Jennifer audio (your Python pipeline, using marin).
 * If Python returns no audioUrl, we do NOT fall back to Twilio "alice".
 */
async function playFromPythonNext(
  twiml: any,
  pythonApi: string,
  baseUrl: string,
  leadId: string,
  userText: string
) {
  const response = await fetch(`${pythonApi}/jennifer/next`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: leadId || "default",
      userText,
    }),
  });

  const data = await response.json();

  if (data?.audioUrl) {
    const filename = data.audioUrl.split("/").pop();
    const publicAudioUrl = `${baseUrl}/api/python-audio/${filename}`;
    twiml.play(publicAudioUrl);
    return { ok: true, data };
  }

  return { ok: false, data };
}

async function handleGather(req: Request) {
  const { searchParams } = new URL(req.url);

  const leadId = searchParams.get("leadId") || "";
  const businessName = searchParams.get("businessName") || ""; // pass this from your /voice route
  const state = (searchParams.get("state") || "VERIFY").toUpperCase(); // VERIFY | SALES

  const baseUrl = process.env.PUBLIC_BASE_URL!;
  const pythonApi = process.env.PYTHON_API_URL || "http://localhost:5000";

  const formData = await req.formData();
  const speech = ((formData.get("SpeechResult") as string) || "").trim();

  console.log(`🗣️ User said: "${speech}"`, { leadId, state, businessName });

  const twiml = new twilio.twiml.VoiceResponse();

  // -------------------------
  // NO SPEECH
  // -------------------------
  if (!speech) {
    const r = await playFromPythonNext(twiml, pythonApi, baseUrl, leadId, "[NO_SPEECH]");

    // If Python fails/no audio, we avoid Alice and just re-gather once
    twiml.gather({
      input: ["speech"],
      action: `${baseUrl}/api/twilio/gather?leadId=${encodeURIComponent(leadId)}&state=${encodeURIComponent(state)}&businessName=${encodeURIComponent(businessName)}`,
      method: "POST",
      timeout: 3,
      speechTimeout: "1",
      bargeIn: true,
    });

    // If you want a verbal prompt here, do it via Python. Otherwise let it be silent.
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }

  // -------------------------
  // STOP / REMOVE
  // -------------------------
  if (shouldStop(speech)) {
    await playFromPythonNext(twiml, pythonApi, baseUrl, leadId, speech);
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }

  // -------------------------
  // VERIFICATION GATE (Business name only)
  // -------------------------
  if (state === "VERIFY") {
    const vr = verifyAnswer(speech);

    if (vr === "NO") {
      await playFromPythonNext(
        twiml,
        pythonApi,
        baseUrl,
        leadId,
        "[WRONG_BUSINESS_ACK]" // let Python respond with apology + end
      );
      twiml.hangup();

      return new NextResponse(twiml.toString(), {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    if (vr === "UNCLEAR") {
      // Ask again, but keep it tight
      await playFromPythonNext(
        twiml,
        pythonApi,
        baseUrl,
        leadId,
        `[VERIFY_REPEAT] Is this ${businessName || "your business"}?`
      );

      twiml.gather({
        input: ["speech"],
        action: `${baseUrl}/api/twilio/gather?leadId=${encodeURIComponent(leadId)}&state=VERIFY&businessName=${encodeURIComponent(businessName)}`,
        method: "POST",
        timeout: 3,
        speechTimeout: "1",
        bargeIn: true,
      });

      return new NextResponse(twiml.toString(), {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    // YES → move to SALES gate, but ask role first (still not pitching)
    await playFromPythonNext(
      twiml,
      pythonApi,
      baseUrl,
      leadId,
      "[ROLE_QUESTION] Perfect—are you the owner or manager?"
    );

    twiml.gather({
      input: ["speech"],
      action: `${baseUrl}/api/twilio/gather?leadId=${encodeURIComponent(leadId)}&state=SALES&businessName=${encodeURIComponent(businessName)}`,
      method: "POST",
      timeout: 3,
      speechTimeout: "1",
      bargeIn: true,
    });

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }

  // -------------------------
  // MAIN CONVERSATION (SALES)
  // -------------------------
  try {
    console.log(`💬 Sending to Python: "${speech}"`);

    const r = await playFromPythonNext(twiml, pythonApi, baseUrl, leadId, speech);

    // If Python fails/no audio, avoid Alice. Just re-gather.
    twiml.gather({
      input: ["speech"],
      action: `${baseUrl}/api/twilio/gather?leadId=${encodeURIComponent(leadId)}&state=SALES&businessName=${encodeURIComponent(businessName)}`,
      method: "POST",
      timeout: 3,
      speechTimeout: "1",
      bargeIn: true,
    });

    // Optional: if you truly want a fallback line, do it via Python, not Alice.
    // await playFromPythonNext(twiml, pythonApi, baseUrl, leadId, "[NO_RESPONSE_FALLBACK]");

    // End-of-flow fallback if they say nothing after gather happens
    twiml.hangup();
  } catch (error) {
    console.error("❌ Python API error:", error);

    // Avoid Alice: just hang up or re-gather
    twiml.gather({
      input: ["speech"],
      action: `${baseUrl}/api/twilio/gather?leadId=${encodeURIComponent(leadId)}&state=SALES&businessName=${encodeURIComponent(businessName)}`,
      method: "POST",
      timeout: 3,
      speechTimeout: "1",
      bargeIn: true,
    });

    twiml.hangup();
  }

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  return handleGather(req);
}
