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
    const authHeader = req.headers.get("x-api-key");
    if (process.env.INTERNAL_API_KEY && authHeader !== process.env.INTERNAL_API_KEY) {
      console.log("❌ Unauthorized request to lookup-by-phone");
      return NextResponse.json({ found: false, error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, phone } = await req.json();
    
    console.log("🔍 LOOKUP REQUEST:", { businessId, phone });
    
    if (!businessId || !phone) {
      console.log("❌ Missing businessId or phone");
      return NextResponse.json({ found: false, error: "Missing businessId/phone" }, { status: 400 });
    }

    const db = await getDb();
    const normalized = normalizePhone(phone);
    const digits = normalized.replace(/[^\d]/g, "");
    const tenDigits = digits.slice(-10); // Get last 10 digits
    
    console.log("📞 Trying formats:", {
      normalized,
      tenDigits,
      withPlus1: `+1${tenDigits}`
    });

    // Try multiple phone formats
    const customer = await db.collection("customers").findOne({
      businessId: String(businessId),
      $or: [
        { phone: normalized },           // +19295356138
        { phone: tenDigits },             // 9295356138
        { phone: `+1${tenDigits}` },      // +19295356138
        { phone: `1${tenDigits}` },       // 19295356138
      ]
    });

    console.log("📄 Customer found:", !!customer);
    if (customer) {
      console.log("👤 Customer details:", { name: customer.name, email: customer.email });
    }

    if (!customer) return NextResponse.json({ found: false });

    return NextResponse.json({
      found: true,
      customer: {
        _id: customer._id.toString(),
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        isReturning: !!customer.isReturning,
      },
    });
  } catch (e: any) {
    console.error("❌ Lookup error:", e);
    return NextResponse.json({ found: false, error: e?.message || "lookup failed" }, { status: 500 });
  }
}