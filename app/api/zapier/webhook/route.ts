import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

async function readBody(req: Request) {
  const ct = (req.headers.get("content-type") || "").toLowerCase();

  // ✅ JSON
  if (ct.includes("application/json")) {
    return await req.json();
  }

  // ✅ Form (Zapier often sends this)
  if (
    ct.includes("application/x-www-form-urlencoded") ||
    ct.includes("multipart/form-data")
  ) {
    const fd = await req.formData();
    const obj: Record<string, any> = {};
    for (const [k, v] of fd.entries()) obj[k] = v;
    return obj;
  }

  // ✅ Fallback: try text -> JSON
  const text = await req.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function tryParseJsonString(v: any) {
  if (typeof v !== "string") return null;

  let s = v.trim();
  if (!s) return null;

  // Handles the exact Zapier weirdness you saw: "=%7B%0D%0A..."
  // i.e. leading "=" then URL-encoded JSON
  if (s.startsWith("=")) s = s.slice(1).trim();
  if (s.includes("%7B") || s.includes("%0A") || s.includes("%22")) {
    try {
      s = decodeURIComponent(s);
    } catch {
      // ignore decode errors
    }
    s = s.trim();
    if (s.startsWith("=")) s = s.slice(1).trim();
  }

  // quick guard
  if (!(s.startsWith("{") || s.startsWith("["))) return null;

  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function normalizeZapierBody(raw: any) {
  // 1) raw string that is JSON or encoded JSON
  const direct = tryParseJsonString(raw);
  if (direct) return direct;

  // 2) form object with JSON hidden inside one field
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    // common wrapper keys
    for (const k of ["data", "payload", "body", "json", "raw"]) {
      const parsed = tryParseJsonString((raw as any)[k]);
      if (parsed) return parsed;
    }

    // very common Zapier case: one key only, value is the JSON string
    const keys = Object.keys(raw);
    if (keys.length === 1) {
      const onlyVal = (raw as any)[keys[0]];
      const parsed = tryParseJsonString(onlyVal);
      if (parsed) return parsed;
    }

    // worst case: empty key "" holds the JSON
    if (typeof (raw as any)[""] === "string") {
      const parsed = tryParseJsonString((raw as any)[""]);
      if (parsed) return parsed;
    }
  }

  return raw;
}

export async function POST(req: Request) {
  const db = await getDb();

  const businessIdRaw = req.headers.get("x-business-id") || "";
  const zapierKey = req.headers.get("x-zapier-key") || "";

  if (!businessIdRaw || !zapierKey) {
    return NextResponse.json(
      { error: "Missing x-business-id or x-zapier-key" },
      { status: 401 }
    );
  }

  const businessObjectId = toObjectId(businessIdRaw);
  if (!businessObjectId) {
    return NextResponse.json(
      { error: "Invalid business id format" },
      { status: 400 }
    );
  }

  const biz = await db.collection("businesses").findOne({
    _id: businessObjectId,
  });

  if (!biz || biz.zapierKey !== zapierKey) {
    return NextResponse.json(
      { error: "Invalid Zapier credentials" },
      { status: 403 }
    );
  }

  const contentType = req.headers.get("content-type") || "";

  let body: any;
  try {
    const raw = await readBody(req);
    body = normalizeZapierBody(raw);
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        detail: e?.message || "Failed to parse body",
        contentType,
      },
      { status: 400 }
    );
  }

  // log every event (store both parsed + helpful debug fields)
  await db.collection("zapier_events").insertOne({
    businessId: businessObjectId,
    body,
    receivedAt: new Date(),
    contentType,
    parsedOk: !!(body && typeof body === "object" && body.event),
  });

  // action: create lead
  if (body?.event === "lead.create") {
    await db.collection("leads").insertOne({
      businessId: businessObjectId,
      name: body?.name || "",
      email: body?.email || "",
      phone: body?.phone || "",
      source: "zapier",
      createdAt: new Date(),
    });
  }

  return NextResponse.json({ success: true });
}
