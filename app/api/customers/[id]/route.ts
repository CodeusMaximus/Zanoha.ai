import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireActiveBusinessId } from "@/lib/tenant";

export const runtime = "nodejs";

type Ctx = {
  params: Promise<{ id: string }>; // ✅ params is async in your Next version
};

async function getId(ctx: Ctx) {
  const { id } = await ctx.params; // ✅ unwrap
  return id;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { businessId } = await requireActiveBusinessId();
  const id = await getId(ctx);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = await getDb();

  const c = await db.collection("customers").findOne({
    _id: new ObjectId(id),
    businessId,
  });

  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    customer: {
      id: c._id.toString(),
      name: c.name || "Unknown",
      phone: c.phone || "",
      email: c.email || "",
      notes: c.notes || "",
      isReturning: !!c.isReturning,
    },
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { businessId } = await requireActiveBusinessId();
  const id = await getId(ctx);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  const update: Record<string, any> = { updatedAt: new Date() };

  if (typeof body.name === "string") update.name = body.name;
  if (typeof body.phone === "string") update.phone = body.phone;
  if (typeof body.email === "string") update.email = body.email;
  if (typeof body.notes === "string") update.notes = body.notes;
  if (typeof body.isReturning === "boolean") update.isReturning = body.isReturning;

  const db = await getDb();

  const res = await db.collection("customers").updateOne(
    { _id: new ObjectId(id), businessId },
    { $set: update }
  );

  if (res.matchedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { businessId } = await requireActiveBusinessId();
  const id = await getId(ctx);

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = await getDb();

  const res = await db.collection("customers").deleteOne({
    _id: new ObjectId(id),
    businessId,
  });

  if (res.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
