import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));

  const db = await getDb();

  // If user already has a membership, just set cookie to that business and go dashboard
  const existing = await db.collection("memberships").findOne({ userId }, { sort: { createdAt: -1 } } as any);
  if (existing?.businessId) {
    const res = NextResponse.redirect(new URL("/dashboard", req.url));
    res.cookies.set("activeBusinessId", String(existing.businessId), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  }

  // Legacy case: exactly 1 business exists -> claim it
  const bizCount = await db.collection("businesses").countDocuments({});
  if (bizCount !== 1) return NextResponse.redirect(new URL("/onboarding", req.url));

  const legacyBiz = await db.collection("businesses").findOne({});
  if (!legacyBiz?._id) return NextResponse.redirect(new URL("/onboarding", req.url));

  const businessId = legacyBiz._id.toString();

  // Insert membership (idempotent)
  await db.collection("memberships").updateOne(
    { userId, businessId },
    { $setOnInsert: { userId, businessId, role: "owner", createdAt: new Date() } },
    { upsert: true }
  );

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.set("activeBusinessId", businessId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
