import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";

function makeKey() {
  return crypto.randomBytes(32).toString("hex");
}

// GET → fetch existing key
export async function GET() {
  const biz = await getOrCreateBusiness();
  const db = await getDb();

  let key = biz.zapierKey;
  if (!key) {
    key = makeKey();
    await db.collection("businesses").updateOne(
      { _id: biz._id },
      { $set: { zapierKey: key, updatedAt: new Date() } }
    );
  }

  return NextResponse.json({
    apiKey: key,
    businessId: biz._id.toString(),
  });
}

// POST → rotate key
export async function POST() {
  const biz = await getOrCreateBusiness();
  const db = await getDb();

  const newKey = makeKey();

  await db.collection("businesses").updateOne(
    { _id: biz._id },
    { $set: { zapierKey: newKey, updatedAt: new Date() } }
  );

  return NextResponse.json({
    apiKey: newKey,
    businessId: biz._id.toString(),
  });
}
