import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

function cleanStr(v: any, max = 200) {
  return String(v ?? "").trim().slice(0, max);
}

function cleanPhone(v: any) {
  const digits = cleanStr(v, 40).replace(/\D/g, "");
  return digits.length >= 10 ? digits : ""; // store blank if invalid
}

function cleanUrl(v: any) {
  const s = cleanStr(v, 300);
  if (!s) return "";
  // allow bare domains; normalize to https
  if (!/^https?:\/\//i.test(s)) return `https://${s}`;
  return s;
}

function toInt(v: any, fallback = 0, max = 100000) {
  const n = parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(max, n));
}

// Map onboarding "role" -> membership role in your system
function mapMembershipRole(role: string) {
  const r = role.toLowerCase();
  if (r.includes("owner")) return "owner";
  if (r.includes("manager")) return "manager";
  // keep it simple; you can expand later
  return "member";
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const name = cleanStr(body?.name, 120);
  const timezone = cleanStr(body?.timezone || "America/New_York", 80);
  if (!name) return NextResponse.json({ error: "Business name required" }, { status: 400 });

  // ✅ New onboarding fields
  const industry = cleanStr(body?.industry, 80);
  const signupRole = cleanStr(body?.role, 80); // role of person signing up
  const phone = cleanPhone(body?.phone);

  const address = {
    line1: cleanStr(body?.address?.line1, 120),
    line2: cleanStr(body?.address?.line2, 120),
    city: cleanStr(body?.address?.city, 80),
    state: cleanStr(body?.address?.state, 10).toUpperCase(),
    zip: cleanStr(body?.address?.zip, 20),
  };

  const yearsInBusiness = toInt(body?.yearsInBusiness, 0, 200);
  const employees = toInt(body?.employees, 0, 100000);
  const revenueRange = cleanStr(body?.revenueRange, 80);
  const website = cleanUrl(body?.website);

  const db = await getDb();
  const now = new Date();

  const bizDoc = {
    name,
    timezone,

    // business profile
    industry,
    phone,
    website,
    address,

    // ops profile
    yearsInBusiness,
    employees,
    revenueRange,

    // metadata
    onboarding: {
      completedAt: now,
      signupRole, // keep original answer
      version: 2,
    },

    createdAt: now,
    updatedAt: now,
  };

  const bizRes = await db.collection("businesses").insertOne(bizDoc);
  const businessId = bizRes.insertedId.toString();

  await db.collection("memberships").insertOne({
    userId,
    businessId,
    role: mapMembershipRole(signupRole) || "owner",
    createdAt: now,
  });

  const res = NextResponse.json({ ok: true, businessId });

  res.cookies.set("activeBusinessId", businessId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}
