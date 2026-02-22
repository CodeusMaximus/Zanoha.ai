 import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Twilio will request this URL when an inbound call comes in (Voice webhook).
 * This returns TwiML that starts <Stream> to your websocket.
 *
 * IMPORTANT:
 * - Pass From/To into <Parameter> so your WS server can lookup/create customers.
 * - Also pass businessId/businessName so it can be SaaS-ready.
 */
export async function POST(req: Request) {
  const wsUrlBase = (process.env.WEBSOCKET_URL || "").trim();
  if (!wsUrlBase) return new NextResponse("Missing WEBSOCKET_URL", { status: 500 });

  // Single-tenant fallback (today)
  const DEFAULT_BUSINESS_ID = (process.env.DEFAULT_BUSINESS_ID || "").trim();
  const DEFAULT_BUSINESS_NAME = (process.env.DEFAULT_BUSINESS_NAME || "Fresh Fade Barbershop").trim();

  // If you want SaaS later: resolve businessId by "To" number inside Next.js here.
  // For now, use DEFAULT_* so create/lookup works.
  const businessId = DEFAULT_BUSINESS_ID;
  const businessName = DEFAULT_BUSINESS_NAME;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrlBase}">
      <!-- Twilio injects {{From}} and {{To}} at runtime -->
      <Parameter name="from" value="{{From}}" />
      <Parameter name="to" value="{{To}}" />
      <Parameter name="callType" value="inbound" />
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
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
