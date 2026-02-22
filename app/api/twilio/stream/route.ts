import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  const params = new URLSearchParams(raw);

  const from = params.get("From") || "";
  const to = params.get("To") || "";
  const callSid = params.get("CallSid") || "";

  const wsUrlBase = process.env.WEBSOCKET_URL; // wss://xxxx.ngrok-free.app
  const businessId = process.env.DEFAULT_BUSINESS_ID || "";
  const businessName = process.env.BUSINESS_NAME || "Your Business";

  if (!wsUrlBase) {
    return new NextResponse("Missing WEBSOCKET_URL", { status: 500 });
  }

  if (!businessId) {
    return new NextResponse("Missing DEFAULT_BUSINESS_ID", { status: 500 });
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrlBase}">
      <Parameter name="callType" value="inbound" />
      <Parameter name="from" value="${escapeXml(from)}" />
      <Parameter name="to" value="${escapeXml(to)}" />
      <Parameter name="callSid" value="${escapeXml(callSid)}" />
      <Parameter name="businessId" value="${escapeXml(businessId)}" />
      <Parameter name="businessName" value="${escapeXml(businessName)}" />
    </Stream>
  </Connect>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function GET(req: Request) {
  return POST(req);
}

function escapeXml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
