import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

function twiml(xml: string) {
  return new NextResponse(xml, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const businessId = url.searchParams.get("businessId") || "";

  try {
    const db = await getDb();
    const cfg = await db.collection("business_twilio").findOne({ businessId });

    // If forwarding enabled, forward the call immediately
    if (cfg?.forwardingEnabled && cfg?.forwardingNumber) {
      return twiml(`
<Response>
  <Dial>
    <Number>${cfg.forwardingNumber}</Number>
  </Dial>
</Response>
`.trim());
    }

    // Otherwise: placeholder (swap this with your AI receptionist TwiML)
    return twiml(`
<Response>
  <Say>Thanks for calling. Please hold while our assistant helps you.</Say>
</Response>
`.trim());
  } catch (e) {
    console.error(e);
    return twiml(`
<Response>
  <Say>Sorry, we are having technical issues. Please try again later.</Say>
</Response>
`.trim());
  }
}
