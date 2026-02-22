import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies(); // ✅ REQUIRED
  const businessId = cookieStore.get("activeBusinessId")?.value || "";

  if (!businessId) {
    return NextResponse.json({ ok: true, badges: {} });
  }

  const db = await getDb();

  const customers = await db.collection("customers").countDocuments({ businessId });

  return NextResponse.json({
    ok: true,
    badges: { customers },
  });
}
