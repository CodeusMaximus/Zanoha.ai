// /api/internal/customers/create
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

function normalizePhone(raw: string) {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (String(raw || "").startsWith("+")) return String(raw);
  return String(raw || "");
}

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-internal-key");
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, name, email, phone } = await req.json();
    if (!businessId || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const p = normalizePhone(phone);
    const db = await getDb();

    const existing = await db.collection("customers").findOne({ businessId, phone: p });
    if (existing) {
      return NextResponse.json({
        customer: { ...existing, _id: existing._id.toString() },
        existed: true,
      });
    }

    const doc = {
      businessId,
      name,
      email: (email || "").toLowerCase(),
      phone: p,
      isReturning: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await db.collection("customers").insertOne(doc);

    return NextResponse.json({
      customer: { ...doc, _id: res.insertedId.toString() },
      existed: false,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
