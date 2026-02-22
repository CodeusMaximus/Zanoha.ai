import { NextResponse } from "next/server";
import { getGmailClientForActiveTenant } from "@/lib/googleGmail";

export const runtime = "nodejs";

function header(headers: any[] | undefined, name: string) {
  const h = (headers || []).find((x) => (x.name || "").toLowerCase() === name.toLowerCase());
  return h?.value || "";
}

function walkParts(part: any, out: any[]) {
  if (!part) return;
  if (part.mimeType === "text/plain" || part.mimeType === "text/html") out.push(part);
  if (part.parts) part.parts.forEach((p: any) => walkParts(p, out));
}

function decodeBase64Url(data?: string) {
  if (!data) return "";
  const s = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return Buffer.from(s + pad, "base64").toString("utf8");
}

export async function GET(req: Request) {
  try {
    const { gmail } = await getGmailClientForActiveTenant();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const tr = await gmail.users.threads.get({ userId: "me", id, format: "full" });

    const messages =
      tr.data.messages?.map((m) => {
        const headers = m.payload?.headers || [];
        const parts: any[] = [];
        walkParts(m.payload, parts);

        const plain = parts.find((p) => p.mimeType === "text/plain");
        const html = parts.find((p) => p.mimeType === "text/html");

        return {
          id: m.id,
          threadId: m.threadId,
          snippet: m.snippet || "",
          internalDate: m.internalDate,
          from: header(headers as any[], "From"),
          to: header(headers as any[], "To"),
          cc: header(headers as any[], "Cc"),
          subject: header(headers as any[], "Subject"),
          date: header(headers as any[], "Date"),
          bodyText: decodeBase64Url(plain?.body?.data),
          bodyHtml: decodeBase64Url(html?.body?.data),
        };
      }) || [];

    return NextResponse.json({ ok: true, thread: { id: tr.data.id, messages } });
  } catch (e: any) {
    const msg = e?.message || "Error";
    const code = e?.code === "NOT_CONNECTED" ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}
