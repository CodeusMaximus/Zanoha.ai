import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth(); // ✅ MUST await in your version
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  const cookieStore = await cookies(); // ✅ in your Next version cookies() is async
  const activeBusinessId = cookieStore.get("activeBusinessId")?.value || "";

  const memberships = await db
    .collection("memberships")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  const businessIds = memberships.map((m: any) => String(m.businessId)).filter(Boolean);

  const objectIds = businessIds
    .map((id) => {
      try {
        return new ObjectId(id);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as ObjectId[];

  const businesses = objectIds.length
    ? await db.collection("businesses").find({ _id: { $in: objectIds } }).toArray()
    : [];

  const map = new Map<string, any>();
  for (const b of businesses) map.set(b._id.toString(), b);

  return NextResponse.json({
    ok: true,
    activeBusinessId,
    businesses: businessIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .map((b: any) => ({
        _id: b._id.toString(),
        name: b.name,
        timezone: b.timezone,
      })),
  });
}
