import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", req.url));

  const { searchParams } = new URL(req.url);
  const businessId = String(searchParams.get("businessId") || "").trim();
  if (!businessId) return NextResponse.redirect(new URL("/onboarding", req.url));

  const db = await getDb();
  const membership = await db.collection("memberships").findOne({ userId, businessId });
  if (!membership) return NextResponse.redirect(new URL("/onboarding", req.url));

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
