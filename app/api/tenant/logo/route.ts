import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

function extFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  if (type === "image/svg+xml") return "svg";
  return "png";
}

export async function POST(req: Request) {
  try {
    const biz = await getOrCreateBusiness();
    const db = await getDb();

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
    }

    // Basic validation
    const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
    if (!allowed.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Only PNG, JPG, WEBP, SVG allowed" },
        { status: 400 }
      );
    }

    // 2MB cap (adjust if you want)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Max size is 2MB" }, { status: 400 });
    }

    const ext = extFromType(file.type);

    const uploadDir = path.join(process.cwd(), "public", "uploads", biz._id.toString());
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `logo.${ext}`;
    const abs = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(abs, Buffer.from(bytes));

    // cache-bust query param so browser updates instantly after upload
    const logoUrl = `/uploads/${biz._id.toString()}/${filename}?v=${Date.now()}`;

    await db.collection("businesses").updateOne(
      { _id: biz._id },
      { $set: { logoUrl, updatedAt: new Date() } }
    );

    return NextResponse.json({ ok: true, logoUrl });
  } catch (e: any) {
    console.error("POST /api/tenant/logo error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const biz = await getOrCreateBusiness();
    const db = await getDb();

    // unset in DB
    await db.collection("businesses").updateOne(
      { _id: biz._id },
      { $set: { logoUrl: null, updatedAt: new Date() } }
    );

    // optional: delete local files (best-effort)
    const uploadDir = path.join(process.cwd(), "public", "uploads", biz._id.toString());
    try {
      const files = await fs.readdir(uploadDir);
      await Promise.all(
        files
          .filter((f) => f.startsWith("logo."))
          .map((f) => fs.unlink(path.join(uploadDir, f)))
      );
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/tenant/logo error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Remove failed" },
      { status: 500 }
    );
  }
}
