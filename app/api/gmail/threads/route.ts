import { NextResponse } from "next/server";
import { getGmailClientForActiveTenant } from "@/lib/googleGmail";

export const runtime = "nodejs";

function header(headers: any[] | undefined, name: string) {
  const h = (headers || []).find((x) => (x.name || "").toLowerCase() === name.toLowerCase());
  return h?.value || "";
}

export async function GET(req: Request) {
  try {
    const { gmail } = await getGmailClientForActiveTenant();
    const { searchParams } = new URL(req.url);

    const label = searchParams.get("label") || "INBOX"; // INBOX, SENT, TRASH, etc.
    const q = searchParams.get("q") || ""; // Gmail search query
    const pageToken = searchParams.get("pageToken") || undefined;
    const maxResults = Math.min(parseInt(searchParams.get("max") || "20", 10) || 20, 50);

    // list threads
    const list = await gmail.users.threads.list({
      userId: "me",
      labelIds: label ? [label] : undefined,
      q: q || undefined,
      maxResults,
      pageToken,
    });

    const threads = list.data.threads || [];

    // hydrate minimal thread metadata (subject/from/date/snippet)
    const hydrated = await Promise.all(
      threads.map(async (t) => {
        const tr = await gmail.users.threads.get({
          userId: "me",
          id: t.id!,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "To", "Date"],
        });

        const firstMsg = tr.data.messages?.[0];
        const lastMsg = tr.data.messages?.[tr.data.messages.length - 1];

        const headers = lastMsg?.payload?.headers || firstMsg?.payload?.headers || [];
        return {
          id: tr.data.id,
          historyId: tr.data.historyId,
          snippet: lastMsg?.snippet || "",
          subject: header(headers as any[], "Subject"),
          from: header(headers as any[], "From"),
          to: header(headers as any[], "To"),
          date: header(headers as any[], "Date"),
          messageCount: tr.data.messages?.length || 0,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      nextPageToken: list.data.nextPageToken || null,
      threads: hydrated,
    });
  } catch (e: any) {
    const msg = e?.message || "Error";
    const code = e?.code === "NOT_CONNECTED" ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}
