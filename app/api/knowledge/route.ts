 import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";
import { requireActiveBusinessId } from "../../../lib/tenant";

export const runtime = "nodejs";

type BuiltinKey =
  | "services"
  | "pricing"
  | "policies"
  | "hours"
  | "faq"
  | "intake"
  | "misc";

type BuiltinState = Record<BuiltinKey, string>;

type CustomSection = {
  id: string;
  title: string;
  content: string;
};

type KBSections = {
  builtins: BuiltinState;
  customs: CustomSection[];
};

type KBRecord = {
  _id?: any;
  businessId: string;
  title: string;
  sections?: KBSections; // ✅ canonical JSON
  rawText?: string;      // ✅ derived (optional but handy)
  createdAt: Date;
  updatedAt: Date;
};

const BUILTINS: Array<{ key: BuiltinKey; label: string }> = [
  { key: "services", label: "Services" },
  { key: "pricing", label: "Pricing" },
  { key: "policies", label: "Policies" },
  { key: "hours", label: "Hours & Location" },
  { key: "faq", label: "FAQ" },
  { key: "intake", label: "Call Handling & Intake" },
  { key: "misc", label: "Anything Else" },
];

function emptyBuiltins(): BuiltinState {
  return {
    services: "",
    pricing: "",
    policies: "",
    hours: "",
    faq: "",
    intake: "",
    misc: "",
  };
}

function cleanStr(v: any, max = 200000) {
  return String(v ?? "").trim().slice(0, max);
}

function sanitizeKb(kb: any) {
  if (!kb) return null;
  return {
    id: kb._id?.toString?.() ?? undefined,
    businessId: String(kb.businessId || ""),
    title: String(kb.title || "Main Knowledge Base"),
    sections: kb.sections || null,
    rawText: kb.rawText || "",
    createdAt: kb.createdAt,
    updatedAt: kb.updatedAt,
  };
}

function compileToRawText(title: string, builtins: BuiltinState, customs: CustomSection[]) {
  const parts: string[] = [];
  parts.push(`# ${title.trim() || "Knowledge Base"}`);
  parts.push(`Last updated: ${new Date().toLocaleString()}`);
  parts.push("");

  for (const b of BUILTINS) {
    const val = (builtins[b.key] || "").trim();
    if (!val) continue;
    parts.push(`## ${b.label}`);
    parts.push(val);
    parts.push("");
  }

  for (const c of customs || []) {
    const h = (c.title || "").trim();
    const body = (c.content || "").trim();
    if (!h && !body) continue;
    parts.push(`## ${h || "Untitled Section"}`);
    if (body) parts.push(body);
    parts.push("");
  }

  return parts.join("\n").trim();
}

function parseFromRaw(raw: string): KBSections {
  const text = (raw || "").replace(/\r\n/g, "\n");

  const matches = [...text.matchAll(/^##\s+(.+)\s*$/gm)];
  const builtins = emptyBuiltins();
  const customs: CustomSection[] = [];

  if (!matches.length) {
    const body = text.trim();
    if (body) builtins.misc = body;
    return { builtins, customs };
  }

  for (let i = 0; i < matches.length; i++) {
    const label = (matches[i][1] || "").trim();
    const start = (matches[i].index ?? 0) + matches[i][0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;

    const content = text
      .slice(start, end)
      .replace(/^\s*\n/, "")
      .trim();

    const builtin = BUILTINS.find((b) => b.label.toLowerCase() === label.toLowerCase());
    if (builtin) {
      builtins[builtin.key] = content;
    } else {
      customs.push({
        id: `sec_${Math.random().toString(16).slice(2)}`,
        title: label || "Untitled Section",
        content,
      });
    }
  }

  return { builtins, customs };
}

function normalizeSections(input: any): KBSections {
  const builtinsIn = input?.builtins || {};
  const customsIn = Array.isArray(input?.customs) ? input.customs : [];

  const builtins: BuiltinState = emptyBuiltins();

  for (const k of Object.keys(builtins) as BuiltinKey[]) {
    builtins[k] = cleanStr(builtinsIn?.[k], 50000);
  }

  const customs: CustomSection[] = customsIn
    .map((c: any) => ({
      id: cleanStr(c?.id, 120) || `sec_${Math.random().toString(16).slice(2)}`,
      title: cleanStr(c?.title, 160) || "Untitled",
      content: cleanStr(c?.content, 80000),
    }))
    .filter((c: CustomSection) => c.title.trim() || c.content.trim());

  return { builtins, customs };
}

export async function GET() {
  try {
    const { businessId } = await requireActiveBusinessId();
    const db = await getDb();

    const kb = await db.collection("knowledge_bases").findOne(
      { businessId: String(businessId) },
      {
        projection: {
          businessId: 1,
          title: 1,
          sections: 1,
          rawText: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    );

    // If no doc, return empty JSON canonical + empty rawText
    if (!kb) {
      const now = new Date();
      const sections: KBSections = { builtins: emptyBuiltins(), customs: [] };
      return NextResponse.json({
        ok: true,
        kb: {
          businessId: String(businessId),
          title: "Main Knowledge Base",
          sections,
          rawText: "",
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    // Back-compat: if sections missing but rawText exists, parse it into JSON
    let sections: KBSections | null = kb.sections || null;
    if (!sections) {
      sections = parseFromRaw(String(kb.rawText || ""));
    }

    // Ensure derived rawText exists (optional)
    const title = String(kb.title || "Main Knowledge Base");
    const derivedRaw = compileToRawText(title, sections.builtins, sections.customs);

    return NextResponse.json({
      ok: true,
      kb: {
        ...sanitizeKb(kb),
        sections,
        rawText: derivedRaw,
      },
    });
  } catch (e: any) {
    const msg = e?.message?.includes("Unauthorized") ? "Unauthorized" : e?.message || "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { businessId } = await requireActiveBusinessId();
    const db = await getDb();

    const body = (await req.json().catch(() => ({}))) as {
      title?: string;
      sections?: any;
    };

    const title = cleanStr(body.title, 200) || "Main Knowledge Base";

    // ✅ canonical JSON
    const sections = normalizeSections(body.sections);

    // Optional: if you want to require at least something filled
    // const hasAny =
    //   Object.values(sections.builtins).some((v) => v.trim()) ||
    //   sections.customs.some((c) => c.title.trim() || c.content.trim());
    // if (!hasAny) return NextResponse.json({ ok: false, error: "Please add at least one section." }, { status: 400 });

    // ✅ derived rawText (stored for convenience/search)
    const rawText = compileToRawText(title, sections.builtins, sections.customs);

    const now = new Date();

    await db.collection("knowledge_bases").updateOne(
      { businessId: String(businessId) },
      {
        $set: {
          businessId: String(businessId),
          title,
          sections,
          rawText,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    const kb = await db.collection("knowledge_bases").findOne(
      { businessId: String(businessId) },
      { projection: { businessId: 1, title: 1, sections: 1, rawText: 1, createdAt: 1, updatedAt: 1 } }
    );

    if (!kb) {
      return NextResponse.json({ ok: false, error: "Failed to save knowledge base." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, kb: sanitizeKb(kb) });
  } catch (e: any) {
    const msg = e?.message?.includes("Unauthorized") ? "Unauthorized" : e?.message || "Server error";
    return NextResponse.json({ ok: false, error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
