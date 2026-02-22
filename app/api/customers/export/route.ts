import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = String(searchParams.get("businessId") || "").trim();

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    const db = await getDb();
    const customers = await db
      .collection("customers")
      .find({ businessId })
      .sort({ createdAt: -1 })
      .toArray();

    const header = ["name", "phone", "email", "notes", "isReturning", "createdAt", "updatedAt"];
    const lines = [header.join(",")];

    for (const c of customers) {
      lines.push(
        [
          csvEscape(c.name),
          csvEscape(c.phone),
          csvEscape(c.email),
          csvEscape(c.notes),
          csvEscape(!!c.isReturning),
          csvEscape(c.createdAt ? new Date(c.createdAt).toISOString() : ""),
          csvEscape(c.updatedAt ? new Date(c.updatedAt).toISOString() : ""),
        ].join(",")
      );
    }

    const csv = lines.join("\n");
    const filename = `customers-${businessId}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Export failed" }, { status: 500 });
  }
}
