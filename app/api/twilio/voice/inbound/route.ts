import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "";

  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const from = params.get("From") || "";

  const wsUrlBase = process.env.PYTHON_SERVICE_URL?.replace("https://", "wss://");

  if (!wsUrlBase) {
    return new NextResponse("Missing PYTHON_SERVICE_URL", { status: 500 });
  }

  try {
    const db = await getDb();
    const cfg = await db.collection("business_twilio").findOne({ businessId });

    // If forwarding enabled, forward the call
    if (cfg?.forwardingEnabled && cfg?.forwardingNumber) {
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Number>${cfg.forwardingNumber}</Number>
  </Dial>
</Response>`, { headers: { "Content-Type": "text/xml; charset=utf-8" } });
    }

    // Connect to Railway AI Receptionist
    const twimlString = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrlBase}">
      <Parameter name="businessId" value="${businessId}" />
      <Parameter name="from" value="${from}" />
    </Stream>
  </Connect>
</Response>`;

    return new NextResponse(twimlString, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });

  } catch (e) {
    console.error(e);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, we are having technical issues. Please try again later.</Say>
</Response>`, { headers: { "Content-Type": "text/xml; charset=utf-8" } });
  }
}

export async function GET(req: Request) {
  return POST(req);
}