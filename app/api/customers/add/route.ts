import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireActiveBusinessId } from "@/lib/tenant";

export const runtime = "nodejs";

/**
 * POST /api/customers/add
 * Creates a new customer in MongoDB
 */
export async function POST(req: NextRequest) {
  // Auth check
  let businessId = "";
  try {
    const r = await requireActiveBusinessId();
    businessId = String(r?.businessId || "");
    if (!businessId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      company,
      address,
      city,
      state,
      zip,
      notes,
      tags,
      isReturning,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const customersCol = db.collection("customers");

    // Build customer document
    const customerDoc: any = {
      businessId, // Tenant isolation
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      isReturning: isReturning || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add optional fields only if provided
    if (company?.trim()) customerDoc.company = company.trim();
    if (address?.trim()) customerDoc.address = address.trim();
    if (city?.trim()) customerDoc.city = city.trim();
    if (state?.trim()) customerDoc.state = state.trim();
    if (zip?.trim()) customerDoc.zip = zip.trim();
    if (notes?.trim()) customerDoc.notes = notes.trim();
    if (Array.isArray(tags) && tags.length > 0) {
      customerDoc.tags = tags.filter((t: any) => typeof t === "string" && t.trim());
    }

    // Insert into database
    const result = await customersCol.insertOne(customerDoc);

    return NextResponse.json({
      success: true,
      customerId: result.insertedId.toString(),
      message: "Customer created successfully",
    });
  } catch (err: any) {
    console.error("create customer error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to create customer",
      },
      { status: 500 }
    );
  }
}