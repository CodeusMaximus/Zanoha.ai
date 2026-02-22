import { NextResponse } from "next/server";
import { getGmailClientForActiveTenant } from "@/lib/googleGmail";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { gmail } = await getGmailClientForActiveTenant();
    const res = await gmail.users.getProfile({ userId: "me" });
    return NextResponse.json({ ok: true, profile: res.data });
  } catch (e: any) {
    const msg = e?.message || "Error";
    const code = e?.code === "NOT_CONNECTED" ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}
