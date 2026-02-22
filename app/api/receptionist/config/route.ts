// app/api/receptionist/config/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    // --------------------------------------------------
    // 🔐 INTERNAL AUTH (matches Python exactly)
    // --------------------------------------------------
    const apiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("x-internal-key") ||
      "";

    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // BODY
    // --------------------------------------------------
    const { businessId } = await req.json();

    if (!businessId) {
      return NextResponse.json(
        { ok: false, error: "Missing businessId" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // --------------------------------------------------
    // FETCH SETTINGS (UNCHANGED COLLECTION)
    // --------------------------------------------------
    const settings = await db
      .collection("business_settings")
      .findOne({ businessId });

    if (!settings) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // RETURN CONFIG (READ-ONLY)
    // --------------------------------------------------
    return NextResponse.json({
      ok: true,

      businessName:
        settings.businessInfo?.businessName || "our business",

      timezone:
        settings.prefs?.timezone || "America/New_York",

      businessHours:
        settings.businessHours || [],

      address:
        settings.address || {},

      departments: (settings.departments || []).filter(
        (d: any) => d.enabled
      ),

      // ✅ ADDITION (THIS IS WHAT YOU NEEDED)
      services: (settings.services || []).filter(
        (s: any) => s.enabled
      ),
    });
  } catch (err) {
    console.error("❌ receptionist/config error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
