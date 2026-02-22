import { NextResponse } from "next/server";
import { requireActiveBusinessId } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET() {
  const { businessId } = await requireActiveBusinessId();
  return NextResponse.json({ ok: true, businessId });
}
