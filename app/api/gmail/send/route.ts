import { NextResponse } from "next/server";
import { getGmailClientForActiveTenant } from "@/lib/googleGmail";

export const runtime = "nodejs";

type Body = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string;
  bcc?: string;
};

function base64UrlEncode(str: string) {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body.to || !body.subject || (!body.text && !body.html)) {
      return NextResponse.json(
        { ok: false, error: "Missing to/subject and text or html" },
        { status: 400 }
      );
    }

    const { gmail } = await getGmailClientForActiveTenant();

    const lines = [
      `To: ${body.to}`,
      body.cc ? `Cc: ${body.cc}` : "",
      body.bcc ? `Bcc: ${body.bcc}` : "",
      `Subject: ${body.subject}`,
      "MIME-Version: 1.0",
      body.html
        ? `Content-Type: text/html; charset="UTF-8"`
        : `Content-Type: text/plain; charset="UTF-8"`,
      "",
      body.html || body.text || "",
    ].filter(Boolean);

    const raw = base64UrlEncode(lines.join("\r\n"));

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    return NextResponse.json({ ok: true, id: res.data.id });
  } catch (e: any) {
    const msg = e?.message || "Error";
    const code = e?.code === "NOT_CONNECTED" ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}
