"use client";

import { useEffect, useMemo, useState } from "react";

type KB = {
  title: string;
  rawText: string;
  updatedAt?: string | Date;
};

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

type SectionId = `builtin:${BuiltinKey}` | `custom:${string}`;

const BUILTINS: Array<{ key: BuiltinKey; label: string; hint: string }> = [
  { key: "services", label: "Services", hint: "What you offer, add-ons, specialties, service areas." },
  { key: "pricing", label: "Pricing", hint: "Prices, packages, memberships, deposits, promos." },
  { key: "policies", label: "Policies", hint: "Late/cancel/no-show, refunds, deposits, age rules." },
  { key: "hours", label: "Hours & Location", hint: "Hours, holidays, address, parking, directions." },
  { key: "faq", label: "FAQ", hint: "Common questions + exact answers you want used." },
  { key: "intake", label: "Call Handling & Intake", hint: "How to greet, what to ask, booking rules, what NOT to do." },
  { key: "misc", label: "Anything Else", hint: "Brand voice, upsell script, staff names, notes." },
];

async function safeJson<T>(
  res: Response
): Promise<{ ok: boolean; data?: T; error?: string; raw?: string }> {
  const text = await res.text();
  if (!text) return { ok: false, error: `Empty response body (status ${res.status}).`, raw: "" };
  try {
    return { ok: res.ok, data: JSON.parse(text) as T, raw: text };
  } catch {
    return { ok: false, error: `Response was not JSON (status ${res.status}).`, raw: text.slice(0, 1200) };
  }
}

function formatWhen(d?: string | Date) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
}

function makeId() {
  // browser-safe
  // @ts-ignore
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `sec_${Math.random().toString(16).slice(2)}`;
}

function compileToRawText(title: string, builtins: BuiltinState, customs: CustomSection[]) {
  const parts: string[] = [];
  parts.push(`# ${title.trim() || "Knowledge Base"}`);
  parts.push(`Last updated: ${new Date().toLocaleString()}`);
  parts.push("");

  // built-ins (in fixed order)
  for (const b of BUILTINS) {
    const val = (builtins[b.key] || "").trim();
    if (!val) continue;
    parts.push(`## ${b.label}`);
    parts.push(val);
    parts.push("");
  }

  // custom sections (in user order)
  for (const c of customs) {
    const h = (c.title || "").trim();
    const body = (c.content || "").trim();
    if (!h && !body) continue;
    parts.push(`## ${h || "Untitled Section"}`);
    if (body) parts.push(body);
    parts.push("");
  }

  return parts.join("\n").trim();
}

function parseFromRaw(raw: string): { builtins: Partial<BuiltinState>; customs: CustomSection[] } {
  const text = (raw || "").replace(/\r\n/g, "\n");

  const matches = [...text.matchAll(/^##\s+(.+)\s*$/gm)];
  if (!matches.length) {
    // no headings => put everything into misc as best effort
    const body = text.trim();
    return body ? { builtins: { misc: body }, customs: [] } : { builtins: {}, customs: [] };
  }

  const builtins: Partial<BuiltinState> = {};
  const customs: CustomSection[] = [];

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
      customs.push({ id: makeId(), title: label || "Untitled Section", content });
    }
  }

  return { builtins, customs };
}

export default function KnowledgeBasePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("Main Knowledge Base");
  const [search, setSearch] = useState("");

  const [builtins, setBuiltins] = useState<BuiltinState>({
    services: "",
    pricing: "",
    policies: "",
    hours: "",
    faq: "",
    intake: "",
    misc: "",
  });

  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [active, setActive] = useState<SectionId>("builtin:services");

  const [saved, setSaved] = useState<KB | null>(null);

  // add section modal
  const [showAdd, setShowAdd] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");

  // Dark mode
  useEffect(() => {
    const check = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Load KB
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/knowledge", { method: "GET" });
        const parsed = await safeJson<{ ok: boolean; kb?: KB; error?: string }>(res);

        if (!parsed.ok || !parsed.data?.ok || !parsed.data.kb) {
          console.error("GET /api/knowledge failed:", parsed.error || parsed.data?.error);
          if (parsed.raw) console.error("RAW:", parsed.raw);
          setSaved(null);
          return;
        }

        const kb = parsed.data.kb;
        setSaved(kb);
        setTitle(kb.title || "Main Knowledge Base");

        const p = parseFromRaw(kb.rawText || "");
        if (Object.keys(p.builtins).length) {
          setBuiltins((prev) => ({ ...prev, ...p.builtins }));
        }
        setCustomSections(p.customs || []);
        // keep a sane active
        setActive("builtin:services");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const surface = isDarkMode ? "bg-neutral-950 text-white" : "bg-neutral-50 text-neutral-900";
  const card = isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200";
  const subtle = isDarkMode ? "text-neutral-400" : "text-neutral-600";
  const label = isDarkMode ? "text-neutral-300" : "text-neutral-700";
  const input = isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-300";
  const ring = isDarkMode ? "focus:ring-white/10" : "focus:ring-black/10";

  const compiled = useMemo(
    () => compileToRawText(title, builtins, customSections),
    [title, builtins, customSections]
  );

  const tabList = useMemo(() => {
    const builtinTabs = BUILTINS.map((b) => ({
      id: `builtin:${b.key}` as SectionId,
      title: b.label,
      hint: b.hint,
      filled: Boolean((builtins[b.key] || "").trim()),
      kind: "builtin" as const,
    }));

    const customTabs = customSections.map((c) => ({
      id: `custom:${c.id}` as SectionId,
      title: c.title || "Untitled",
      hint: "Custom section",
      filled: Boolean((c.content || "").trim()),
      kind: "custom" as const,
    }));

    return [...builtinTabs, ...customTabs];
  }, [builtins, customSections]);

  const activeMeta = useMemo(() => {
    if (active.startsWith("builtin:")) {
      const key = active.replace("builtin:", "") as BuiltinKey;
      const b = BUILTINS.find((x) => x.key === key);
      return {
        kind: "builtin" as const,
        title: b?.label || "Section",
        hint: b?.hint || "",
        value: builtins[key] || "",
        key,
      };
    }
    const id = active.replace("custom:", "");
    const c = customSections.find((x) => x.id === id);
    return {
      kind: "custom" as const,
      title: c?.title || "Untitled",
      hint: "Custom section",
      value: c?.content || "",
      id,
    };
  }, [active, builtins, customSections]);

  const previewFiltered = useMemo(() => {
    if (!search.trim()) return compiled;
    const q = search.trim().toLowerCase();

    // Filter builtins + customs that match
    const matchedBuiltins: Partial<BuiltinState> = {};
    for (const b of BUILTINS) {
      const body = (builtins[b.key] || "").trim();
      if (!body) continue;
      const hay = `${b.label}\n${body}`.toLowerCase();
      if (hay.includes(q)) matchedBuiltins[b.key] = body;
    }

    const matchedCustoms = customSections.filter((c) => {
      const hay = `${c.title}\n${c.content}`.toLowerCase();
      return hay.includes(q);
    });

    if (!Object.keys(matchedBuiltins).length && !matchedCustoms.length) {
      return `# ${title}\n\nNo matches for "${search}".`;
    }

    // For filtered preview: include only matched builtins (in correct order) + matched customs
    const builtinsFull: BuiltinState = {
      services: matchedBuiltins.services || "",
      pricing: matchedBuiltins.pricing || "",
      policies: matchedBuiltins.policies || "",
      hours: matchedBuiltins.hours || "",
      faq: matchedBuiltins.faq || "",
      intake: matchedBuiltins.intake || "",
      misc: matchedBuiltins.misc || "",
    };

    return compileToRawText(title, builtinsFull, matchedCustoms);
  }, [search, compiled, builtins, customSections, title]);

  function setBuiltinValue(key: BuiltinKey, value: string) {
    setBuiltins((prev) => ({ ...prev, [key]: value }));
  }

  function setCustomValue(id: string, patch: Partial<CustomSection>) {
    setCustomSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function deleteCustom(id: string) {
    setCustomSections((prev) => prev.filter((s) => s.id !== id));
    if (active === (`custom:${id}` as SectionId)) {
      setActive("builtin:services");
    }
  }

  function addCustomSection() {
    const t = newSectionTitle.trim() || "New Section";
    const c = newSectionContent.trim();
    const id = makeId();
    setCustomSections((prev) => [...prev, { id, title: t, content: c }]);
    setActive(`custom:${id}`);
    setNewSectionTitle("");
    setNewSectionContent("");
    setShowAdd(false);
  }

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, rawText: compiled }),
      });

      const parsed = await safeJson<{ ok: boolean; kb?: KB; error?: string }>(res);

      if (!parsed.ok || !parsed.data) {
        console.error("POST failed:", parsed.error);
        if (parsed.raw) console.error("RAW:", parsed.raw);
        alert("Save failed. Check console for details.");
        return;
      }

      if (!parsed.data.ok) {
        alert(parsed.data.error || "Failed to save.");
        return;
      }

      if (parsed.data.kb) setSaved(parsed.data.kb);
      alert("Saved!");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`min-h-screen ${surface} transition-colors duration-200`}>
      <div className="max-w-[1500px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">Knowledge Base</h1>
          <p className={`mt-2 text-base leading-relaxed ${subtle}`}>
            Build your receptionist’s “brain” in sections. Preview is searchable and scrolls independently.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left: Editor */}
          <div className={`xl:col-span-7 rounded-2xl border ${card} p-6`}>
            {/* Title + actions */}
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between mb-6">
              <div className="flex-1">
                <label className={`text-sm font-medium ${label}`}>Knowledge Base Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`mt-2 w-full px-4 py-3 rounded-xl border ${input} outline-none focus:ring-4 ${ring}`}
                  placeholder="e.g., Fresh Fade Barbershop"
                />
                <div className={`mt-2 text-xs ${subtle}`}>
                  Tip: Use the exact business name callers say.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`text-xs ${subtle}`}>
                  Last saved: <span className="font-medium">{formatWhen(saved?.updatedAt)}</span>
                </div>

                <button
                  onClick={() => setShowAdd(true)}
                  className={`px-4 py-3 rounded-xl font-semibold border transition-colors ${
                    isDarkMode
                      ? "border-neutral-800 text-neutral-200 hover:bg-neutral-800"
                      : "border-neutral-200 text-neutral-800 hover:bg-neutral-100"
                  }`}
                >
                  + Add section
                </button>

                <button
                  disabled={saving || loading}
                  onClick={onSave}
                  className={`px-5 py-3 rounded-xl font-semibold tracking-tight transition-colors ${
                    saving || loading
                      ? isDarkMode
                        ? "bg-neutral-800 text-neutral-400"
                        : "bg-neutral-200 text-neutral-500"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className={`rounded-2xl border ${isDarkMode ? "border-neutral-800" : "border-neutral-200"} overflow-hidden`}>
              <div className={`${isDarkMode ? "bg-neutral-900" : "bg-white"} p-2`}>
                <div className="flex gap-2 overflow-x-auto">
                  {tabList.map((t) => {
                    const activeTab = active === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActive(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap text-sm font-semibold transition-colors ${
                          activeTab
                            ? isDarkMode
                              ? "bg-white text-neutral-900"
                              : "bg-neutral-900 text-white"
                            : isDarkMode
                            ? "text-neutral-300 hover:bg-neutral-800"
                            : "text-neutral-700 hover:bg-neutral-100"
                        }`}
                      >
                        <span className="max-w-[220px] truncate">{t.title}</span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border ${
                            t.filled
                              ? isDarkMode
                                ? "border-emerald-500/40 text-emerald-300"
                                : "border-emerald-600/30 text-emerald-700"
                              : isDarkMode
                              ? "border-neutral-700 text-neutral-400"
                              : "border-neutral-300 text-neutral-500"
                          }`}
                        >
                          {t.filled ? "Added" : "Empty"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active editor */}
              <div className={`p-5 ${isDarkMode ? "bg-neutral-950/30" : "bg-neutral-50/60"} border-t ${isDarkMode ? "border-neutral-800" : "border-neutral-200"}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold tracking-tight">{activeMeta.title}</div>
                    <div className={`text-sm ${subtle}`}>{activeMeta.hint}</div>
                  </div>

                  {/* Custom section controls */}
                  {activeMeta.kind === "custom" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteCustom(activeMeta.id)}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                          isDarkMode
                            ? "border-red-500/30 text-red-300 hover:bg-red-500/10"
                            : "border-red-500/30 text-red-700 hover:bg-red-50"
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Custom section title editor */}
                {activeMeta.kind === "custom" && (
                  <div className="mb-3">
                    <label className={`text-sm font-medium ${label}`}>Section title</label>
                    <input
                      value={activeMeta.title}
                      onChange={(e) => setCustomValue(activeMeta.id, { title: e.target.value })}
                      className={`mt-2 w-full px-4 py-3 rounded-xl border ${input} outline-none focus:ring-4 ${ring}`}
                      placeholder="e.g., Bridal Packages"
                    />
                  </div>
                )}

                <textarea
                  value={activeMeta.value}
                  onChange={(e) => {
                    if (activeMeta.kind === "builtin") setBuiltinValue(activeMeta.key, e.target.value);
                    else setCustomValue(activeMeta.id, { content: e.target.value });
                  }}
                  rows={12}
                  className={`w-full px-4 py-3 rounded-2xl border ${input} outline-none focus:ring-4 ${ring} text-[15px] leading-relaxed`}
                  placeholder="Write naturally. Bullet points are great."
                />

                <div className="mt-3 flex items-center justify-between">
                  <div className={`text-xs ${subtle}`}>{(activeMeta.value || "").length.toLocaleString()} characters</div>
                  <button
                    onClick={() => {
                      if (activeMeta.kind === "builtin") setBuiltinValue(activeMeta.key, "");
                      else setCustomValue(activeMeta.id, { content: "" });
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      isDarkMode
                        ? "border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                        : "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    Clear section
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview + TOC */}
          <div className="xl:col-span-5 space-y-6">
            {/* Preview */}
            <div className={`rounded-2xl border ${card} p-6`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Live Preview</h2>
                  <p className={`mt-1 text-sm ${subtle}`}>
                    This is what will be stored and used for retrieval during calls.
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    isDarkMode ? "border-neutral-700 text-neutral-300" : "border-neutral-300 text-neutral-700"
                  }`}
                >
                  {compiled.length.toLocaleString()} chars
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${input} outline-none focus:ring-4 ${ring} text-sm`}
                  placeholder="Search preview (e.g., 'deposit', 'late', 'beard')"
                />
                <button
                  onClick={() => setSearch("")}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    isDarkMode
                      ? "border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                      : "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  Clear
                </button>
              </div>

              <div
                className={`mt-4 rounded-2xl border p-4 whitespace-pre-wrap text-[14px] leading-relaxed ${
                  isDarkMode
                    ? "border-neutral-800 bg-neutral-950/40 text-neutral-200"
                    : "border-neutral-200 bg-neutral-50 text-neutral-800"
                }`}
                style={{ maxHeight: 520, overflow: "auto" }}
              >
                {previewFiltered || `# ${title}\n\nNothing yet — start adding sections on the left.`}
              </div>
            </div>

            {/* Quick Jump */}
            <div className={`rounded-2xl border ${card} p-6`}>
              <h3 className="text-lg font-semibold tracking-tight">Quick Jump</h3>
              <p className={`mt-1 text-sm ${subtle}`}>Jump between sections without scrolling.</p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tabList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActive(t.id)}
                    className={`p-3 rounded-2xl border text-left transition-colors ${
                      active === t.id
                        ? isDarkMode
                          ? "border-white/20 bg-white/5"
                          : "border-black/20 bg-black/5"
                        : isDarkMode
                        ? "border-neutral-800 hover:bg-neutral-800"
                        : "border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold truncate">{t.title}</div>
                      <div
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                          t.filled
                            ? isDarkMode
                              ? "border-emerald-500/40 text-emerald-300"
                              : "border-emerald-600/30 text-emerald-700"
                            : isDarkMode
                            ? "border-neutral-700 text-neutral-400"
                            : "border-neutral-300 text-neutral-500"
                        }`}
                      >
                        {t.filled ? "Added" : "Empty"}
                      </div>
                    </div>
                    <div className={`mt-1 text-xs ${subtle}`}>{t.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tip box */}
            <div className={`rounded-2xl border ${card} p-6`}>
              <h3 className="text-lg font-semibold tracking-tight">What this powers</h3>
              <ul className={`mt-3 space-y-2 text-sm ${subtle} leading-relaxed`}>
                <li>• Accurate answers during calls (“Do you take walk-ins?”, “How much is a fade?”)</li>
                <li>• Policy enforcement (“Late policy”, “No-show fee”, “Deposit rules”)</li>
                <li>• Better booking behavior (what info to collect, how to confirm)</li>
                <li>• Consistent upsells (packages, add-ons, scripts)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add Section Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAdd(false)}
            />
            <div
              className={`relative w-full max-w-xl rounded-2xl border p-6 ${card}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">Add a new section</h3>
                  <p className={`mt-1 text-sm ${subtle}`}>
                    Example: “Bridal Packages”, “Aftercare”, “Spanish Script”, “Neighborhood Notes”.
                  </p>
                </div>
                <button
                  onClick={() => setShowAdd(false)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    isDarkMode
                      ? "border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                      : "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  Close
                </button>
              </div>

              <div className="mt-5">
                <label className={`text-sm font-medium ${label}`}>Section title</label>
                <input
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  className={`mt-2 w-full px-4 py-3 rounded-xl border ${input} outline-none focus:ring-4 ${ring}`}
                  placeholder="e.g., Deposits & No-shows"
                  autoFocus
                />
              </div>

              <div className="mt-4">
                <label className={`text-sm font-medium ${label}`}>Optional content</label>
                <textarea
                  value={newSectionContent}
                  onChange={(e) => setNewSectionContent(e.target.value)}
                  rows={6}
                  className={`mt-2 w-full px-4 py-3 rounded-2xl border ${input} outline-none focus:ring-4 ${ring} text-[15px] leading-relaxed`}
                  placeholder="Paste anything here (you can fill it later)."
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className={`px-4 py-3 rounded-xl font-semibold border transition-colors ${
                    isDarkMode
                      ? "border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                      : "border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomSection}
                  className="px-5 py-3 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                >
                  Add section
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
