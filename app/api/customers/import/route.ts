 import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { parse } from "papaparse";

export const runtime = "nodejs";

type ImportRow = {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  isReturning?: string | boolean | number;
};

function normPhone(input: string) {
  return (input || "").replace(/[^\d]/g, "");
}

function toBool(v: any) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function hasValue(v: any) {
  return v !== undefined && v !== null && String(v).trim().length > 0;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const businessId = String(form.get("businessId") || "").trim();
    const file = form.get("file") as File | null;

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "Please upload a .csv file" },
        { status: 400 }
      );
    }

    const csvText = await file.text();

    const parsed = parse<ImportRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (parsed.errors?.length) {
      return NextResponse.json(
        { error: "CSV parse error", details: parsed.errors.slice(0, 5) },
        { status: 400 }
      );
    }

    const rows = (parsed.data || []).filter(Boolean);
    if (!rows.length) {
      return NextResponse.json(
        { ok: true, inserted: 0, updated: 0, skipped: 0 },
        { status: 200 }
      );
    }

    const db = await getDb();
    const col = db.collection("customers");
    const now = new Date();

    let skipped = 0;

    const ops = rows
      .map((r) => {
        const name = String(r.name || "").trim();
        const phone = normPhone(String(r.phone || "").trim());
        const email = String(r.email || "").trim().toLowerCase();
        const notes = String(r.notes || "").trim();

        const hasPhone = !!phone;
        const hasEmail = !!email;

        if (!hasPhone && !hasEmail) {
          skipped++;
          return null;
        }

        // Upsert key preference: phone -> email
        const filter = hasPhone ? { businessId, phone } : { businessId, email };

        // Determine if CSV included isReturning explicitly
        const rowHasReturning = hasValue(r.isReturning);
        const isReturning = rowHasReturning ? toBool(r.isReturning) : undefined;

        // ✅ Never set businessId in $set
        const set: any = { updatedAt: now };

        if (name) set.name = name;
        if (phone) set.phone = phone;
        if (email) set.email = email;
        if (notes) set.notes = notes;

        // ✅ Only set isReturning in $set if CSV provided it
        if (rowHasReturning) set.isReturning = isReturning;

        // ✅ Only set isReturning on insert if CSV did NOT provide it
        const setOnInsert: any = {
          businessId,
          createdAt: now,
        };
        if (!rowHasReturning) setOnInsert.isReturning = false;

        return {
          updateOne: {
            filter,
            update: {
              $setOnInsert: setOnInsert,
              $set: set,
            },
            upsert: true,
          },
        };
      })
      .filter(Boolean) as any[];

    if (!ops.length) {
      return NextResponse.json(
        { ok: true, inserted: 0, updated: 0, skipped },
        { status: 200 }
      );
    }

    const result = await col.bulkWrite(ops, { ordered: false });

    return NextResponse.json(
      {
        ok: true,
        inserted: result.upsertedCount || 0,
        updated: result.modifiedCount || 0,
        matched: result.matchedCount || 0,
        skipped,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Import failed" },
      { status: 500 }
    );
  }
}
