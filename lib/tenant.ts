import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function requireActiveBusinessId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const db = await getDb();
  const cookieStore = await cookies();
  const activeBusinessId = cookieStore.get("activeBusinessId")?.value || "";

  // Helper: pick a valid business from membership
  async function pickMembershipBusinessId() {
    const m = await db
      .collection("memberships")
      .findOne({ userId }, { sort: { createdAt: -1 } } as any);

    if (!m?.businessId) throw new Error("No business membership");
    return String(m.businessId);
  }

  // No cookie -> use membership
  if (!activeBusinessId) {
    const businessId = await pickMembershipBusinessId();
    return { userId, businessId };
  }

  // Cookie exists -> verify it belongs to user
  const ok = await db.collection("memberships").findOne({
    userId,
    businessId: activeBusinessId,
  });

  // ✅ If cookie is stale/wrong (common when switching accounts), fall back safely
  if (!ok) {
    const businessId = await pickMembershipBusinessId();
    return { userId, businessId };
  }

  return { userId, businessId: activeBusinessId };
}

export async function getBusinessById(businessId: string) {
  const db = await getDb();
  return db.collection("businesses").findOne({ _id: new ObjectId(businessId) });
}
