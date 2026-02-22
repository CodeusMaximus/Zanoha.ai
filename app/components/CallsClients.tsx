"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Calendar,
  Filter,
  Search,
  Sparkles,
  X,
  Rocket,
  Megaphone,
  Bell,
  BadgeCheck,
  ChevronDown,
} from "lucide-react";

type CallRow = {
  _id: string;
  status: string;
  callSid?: string | null;
  fromPhone: string;
  toPhone: string;
  transcript?: string | null;
  duration?: number | null;
  createdAt: string; // ISO string
  direction?: "inbound" | "outbound" | string;
  cost?: number | string | null;
  recordingUrl?: string | null;
};

type Props = {
  calls: CallRow[];
};

type CampaignType = "upsell" | "notify" | "remind";

function formatDT(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatSecondsToMMSS(seconds?: number | null) {
  if (typeof seconds !== "number" || !isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function pillClasses(isDark: boolean, tone: "neutral" | "good" | "warn" | "bad") {
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1";
  if (isDark) {
    if (tone === "good") return `${base} bg-emerald-500/10 text-emerald-300 ring-emerald-500/20`;
    if (tone === "warn") return `${base} bg-amber-500/10 text-amber-300 ring-amber-500/20`;
    if (tone === "bad") return `${base} bg-red-500/10 text-red-300 ring-red-500/20`;
    return `${base} bg-white/10 text-zinc-200 ring-white/10`;
  } else {
    if (tone === "good") return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
    if (tone === "warn") return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
    if (tone === "bad") return `${base} bg-red-50 text-red-700 ring-red-200`;
    return `${base} bg-neutral-100 text-neutral-700 ring-neutral-200`;
  }
}

function StatCard({
  isDark,
  title,
  value,
  sub,
  icon,
}: {
  isDark: boolean;
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 transition-colors",
        isDark ? "border-white/10 bg-white/[0.03]" : "border-neutral-200 bg-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={isDark ? "text-xs text-zinc-400" : "text-xs text-neutral-600"}>{title}</div>
          <div className={isDark ? "mt-1 text-2xl font-semibold text-white" : "mt-1 text-2xl font-semibold text-neutral-900"}>
            {value}
          </div>
          {sub ? (
            <div className={isDark ? "mt-1 text-xs text-zinc-500" : "mt-1 text-xs text-neutral-500"}>{sub}</div>
          ) : null}
        </div>

        <div
          className={[
            "grid h-10 w-10 place-items-center rounded-xl ring-1",
            isDark ? "bg-white/5 ring-white/10 text-white" : "bg-neutral-50 ring-neutral-200 text-neutral-900",
          ].join(" ")}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function CampaignTypePill({ isDark, type }: { isDark: boolean; type: CampaignType }) {
  const map: Record<CampaignType, { label: string; icon: React.ReactNode; tone: "neutral" | "good" | "warn" | "bad" }> = {
    upsell: { label: "Upsell", icon: <Rocket size={12} />, tone: "good" },
    notify: { label: "Notify", icon: <Megaphone size={12} />, tone: "neutral" },
    remind: { label: "Remind", icon: <Bell size={12} />, tone: "warn" },
  };
  const item = map[type];
  return <span className={pillClasses(isDark, item.tone)}>{item.icon}{item.label}</span>;
}

export default function CallsClient({ calls }: Props) {
  // ✅ Respect app-level light/dark (Tailwind "dark" class on <html>)
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Page UI state
  const [q, setQ] = useState("");
  const [dir, setDir] = useState<"all" | "inbound" | "outbound">("all");
  const [status, setStatus] = useState<"all" | "completed" | "failed" | "in-progress">("all");
  const [range, setRange] = useState<"all" | "today" | "7d" | "30d">("30d");

  // Campaign modal state
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignType, setCampaignType] = useState<CampaignType>("upsell");
  const [campaignName, setCampaignName] = useState("January Upsell Campaign");
  const [campaignNotes, setCampaignNotes] = useState(
    "Offer customers a special deal and book a discovery call if they are interested."
  );
  const [target, setTarget] = useState<"all" | "missed" | "outboundOnly" | "inboundOnly">("all");
  const [includeDiscoveryBooking, setIncludeDiscoveryBooking] = useState(true);

  // Derived
  const now = Date.now();
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    const cutoff =
      range === "today"
        ? now - 24 * 60 * 60 * 1000
        : range === "7d"
        ? now - 7 * 24 * 60 * 60 * 1000
        : range === "30d"
        ? now - 30 * 24 * 60 * 60 * 1000
        : 0;

    return (calls || [])
      .filter((c) => {
        const d = new Date(c.createdAt).getTime();
        if (cutoff && d < cutoff) return false;

        const direction = (c.direction || "").toLowerCase();
        if (dir !== "all" && direction !== dir) return false;

        const st = (c.status || "").toLowerCase();
        if (status !== "all" && st !== status) return false;

        if (!query) return true;
        const hay = `${c.fromPhone} ${c.toPhone} ${c.status} ${c.direction} ${c.transcript || ""}`.toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [calls, q, dir, status, range, now]);

  const stats = useMemo(() => {
    const all = filtered.length;
    const inbound = filtered.filter((c) => (c.direction || "").toLowerCase() === "inbound").length;
    const outbound = filtered.filter((c) => (c.direction || "").toLowerCase() === "outbound").length;

    const totalSeconds = filtered.reduce((sum, c) => sum + (typeof c.duration === "number" ? c.duration : 0), 0);
    const avgSeconds = all > 0 ? Math.round(totalSeconds / all) : 0;

    const completed = filtered.filter((c) => (c.status || "").toLowerCase() === "completed").length;
    const failed = filtered.filter((c) => (c.status || "").toLowerCase() === "failed").length;

    // “Type of call” for later wiring: direction is the “type” for now
    return { all, inbound, outbound, avgSeconds, completed, failed };
  }, [filtered]);

  const wrapCls = [
    "min-h-[calc(100vh-64px)] transition-colors",
    isDark ? "bg-[#0b0f17] text-white" : "bg-neutral-50 text-neutral-900",
  ].join(" ");

  const cardCls = [
    "rounded-2xl border transition-colors",
    isDark ? "border-white/10 bg-white/[0.03]" : "border-neutral-200 bg-white",
  ].join(" ");

  const inputCls = [
    "w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors",
    isDark
      ? "border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-white/20"
      : "border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300",
  ].join(" ");

  const selectCls = [
    "rounded-xl border px-3 py-2 text-sm outline-none transition-colors",
    isDark ? "border-white/10 bg-white/5 text-white" : "border-neutral-200 bg-white text-neutral-900",
  ].join(" ");

  return (
    <div className={wrapCls}>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <PhoneCall size={20} className={isDark ? "text-white" : "text-neutral-900"} />
              <h1 className={isDark ? "text-3xl font-bold tracking-tight text-white" : "text-3xl font-bold tracking-tight text-neutral-900"}>
                Calls
              </h1>
            </div>
            <p className={isDark ? "mt-2 text-sm text-zinc-400" : "mt-2 text-sm text-neutral-600"}>
              Track inbound/outbound calls, timestamps, status, and transcripts. Campaigns can be launched from here.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setCampaignOpen(true)}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ring-1 transition",
                isDark
                  ? "bg-white/10 text-white ring-white/15 hover:bg-white/15"
                  : "bg-neutral-900 text-white ring-neutral-900/10 hover:bg-neutral-800",
              ].join(" ")}
            >
              <Sparkles size={16} />
              Run AI Campaign
            </button>

            <button
              type="button"
              onClick={() => {
                setQ("");
                setDir("all");
                setStatus("all");
                setRange("30d");
              }}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ring-1 transition",
                isDark
                  ? "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
                  : "bg-white text-neutral-900 ring-neutral-200 hover:bg-neutral-50",
              ].join(" ")}
            >
              <Filter size={16} />
              Reset filters
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <StatCard
            isDark={isDark}
            title="Total calls"
            value={stats.all}
            sub={range === "all" ? "All time (filtered)" : `Last ${range === "today" ? "24h" : range}`}
            icon={<PhoneCall size={18} />}
          />
          <StatCard
            isDark={isDark}
            title="Inbound"
            value={stats.inbound}
            sub="Calls received"
            icon={<PhoneIncoming size={18} />}
          />
          <StatCard
            isDark={isDark}
            title="Outbound"
            value={stats.outbound}
            sub="Calls placed"
            icon={<PhoneOutgoing size={18} />}
          />
          <StatCard
            isDark={isDark}
            title="Avg duration"
            value={formatSecondsToMMSS(stats.avgSeconds)}
            sub={`Completed: ${stats.completed} • Failed: ${stats.failed}`}
            icon={<Calendar size={18} />}
          />
        </div>

        {/* Controls */}
        <div className={["mt-6 p-4", cardCls].join(" ")}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
            <div className="md:col-span-5">
              <div className="relative">
                <Search size={16} className={["absolute left-3 top-1/2 -translate-y-1/2", isDark ? "text-zinc-400" : "text-neutral-500"].join(" ")} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search phone, status, direction, transcript…"
                  className={[inputCls, "pl-9"].join(" ")}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <select value={range} onChange={(e) => setRange(e.target.value as any)} className={selectCls}>
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select value={dir} onChange={(e) => setDir(e.target.value as any)} className={selectCls}>
                <option value="all">All directions</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={selectCls}>
                <option value="all">All status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="in-progress">In progress</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={["mt-4 overflow-hidden", cardCls].join(" ")}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className={isDark ? "text-sm text-zinc-300" : "text-sm text-neutral-700"}>
              Showing <span className={isDark ? "font-semibold text-white" : "font-semibold text-neutral-900"}>{filtered.length}</span>{" "}
              calls
            </div>

            <div className={isDark ? "text-xs text-zinc-500" : "text-xs text-neutral-500"}>
              (We’ll wire inbound/outbound totals + exact call types into backend later — UI is ready.)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                className={[
                  "text-left text-xs",
                  isDark ? "bg-white/[0.02] text-zinc-400" : "bg-neutral-50 text-neutral-600",
                ].join(" ")}
              >
                <tr>
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Transcript</th>
                </tr>
              </thead>

              <tbody className={isDark ? "divide-y divide-white/10" : "divide-y divide-neutral-200"}>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={["px-4 py-10 text-center text-sm", isDark ? "text-zinc-400" : "text-neutral-500"].join(" ")}>
                      No calls found for your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const d = (c.direction || "").toLowerCase();
                    const typeLabel =
                      d === "inbound" ? "Inbound" : d === "outbound" ? "Outbound" : (c.direction || "Unknown");
                    const typeTone = d === "inbound" ? "neutral" : d === "outbound" ? "good" : "warn";

                    const st = (c.status || "").toLowerCase();
                    const stTone = st === "completed" ? "good" : st === "failed" ? "bad" : "warn";

                    return (
                      <tr key={c._id} className={isDark ? "hover:bg-white/[0.03]" : "hover:bg-neutral-50"}>
                        <td className="px-4 py-3 text-sm">{formatDT(c.createdAt)}</td>

                        <td className="px-4 py-3">
                          <span className={pillClasses(isDark, typeTone as any)}>
                            {d === "inbound" ? <PhoneIncoming size={12} /> : d === "outbound" ? <PhoneOutgoing size={12} /> : <PhoneCall size={12} />}
                            {typeLabel}
                          </span>
                        </td>

                        <td className={["px-4 py-3 text-sm", isDark ? "text-zinc-200" : "text-neutral-800"].join(" ")}>{c.fromPhone || "—"}</td>
                        <td className={["px-4 py-3 text-sm", isDark ? "text-zinc-200" : "text-neutral-800"].join(" ")}>{c.toPhone || "—"}</td>

                        <td className="px-4 py-3">
                          <span className={pillClasses(isDark, stTone as any)}>
                            {st === "completed" ? <BadgeCheck size={12} /> : null}
                            {c.status || "unknown"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm">{formatSecondsToMMSS(c.duration)}</td>

                        <td className="px-4 py-3 text-sm">
                          {c.transcript ? (
                            <details className="group">
                              <summary
                                className={[
                                  "cursor-pointer select-none inline-flex items-center gap-2",
                                  isDark ? "text-zinc-200" : "text-neutral-800",
                                ].join(" ")}
                              >
                                View
                                <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                              </summary>
                              <div
                                className={[
                                  "mt-2 rounded-xl border p-3 text-xs leading-relaxed",
                                  isDark ? "border-white/10 bg-white/5 text-zinc-200" : "border-neutral-200 bg-white text-neutral-700",
                                ].join(" ")}
                              >
                                {c.transcript}
                              </div>
                            </details>
                          ) : (
                            <span className={isDark ? "text-zinc-500" : "text-neutral-400"}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Campaign Modal (UI ONLY) */}
      <AnimatePresence>
        {campaignOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCampaignOpen(false)}
            />

            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <div
                className={[
                  "w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl",
                  isDark ? "border-white/10 bg-[#0a0e14]" : "border-neutral-200 bg-white",
                ].join(" ")}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className={["flex items-center justify-between px-5 py-4", isDark ? "border-b border-white/10" : "border-b border-neutral-200"].join(" ")}>
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        "grid h-10 w-10 place-items-center rounded-xl ring-1",
                        isDark ? "bg-white/5 ring-white/10 text-white" : "bg-neutral-50 ring-neutral-200 text-neutral-900",
                      ].join(" ")}
                    >
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-neutral-900"}>
                        Run AI Calling Campaign
                      </div>
                      <div className={isDark ? "text-xs text-zinc-400" : "text-xs text-neutral-600"}>
                        UI only for now — we’ll wire to Twilio + Leads + Calendar later.
                      </div>
                    </div>
                  </div>

                  <button
                    className={[
                      "grid h-10 w-10 place-items-center rounded-xl ring-1 transition",
                      isDark ? "bg-white/5 ring-white/10 hover:bg-white/10 text-white" : "bg-neutral-50 ring-neutral-200 hover:bg-neutral-100 text-neutral-900",
                    ].join(" ")}
                    onClick={() => setCampaignOpen(false)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-8">
                      <label className={isDark ? "text-xs font-medium text-zinc-300" : "text-xs font-medium text-neutral-700"}>
                        Campaign name
                      </label>
                      <input className={["mt-1", inputCls].join(" ")} value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
                    </div>

                    <div className="md:col-span-4">
                      <label className={isDark ? "text-xs font-medium text-zinc-300" : "text-xs font-medium text-neutral-700"}>
                        Campaign type
                      </label>
                      <div className="mt-1 flex gap-2">
                        {(["upsell", "notify", "remind"] as CampaignType[]).map((t) => {
                          const active = campaignType === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setCampaignType(t)}
                              className={[
                                "flex-1 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition",
                                active
                                  ? isDark
                                    ? "bg-white/15 text-white ring-white/20"
                                    : "bg-neutral-900 text-white ring-neutral-900/10"
                                  : isDark
                                  ? "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
                                  : "bg-white text-neutral-900 ring-neutral-200 hover:bg-neutral-50",
                              ].join(" ")}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <CampaignTypePill isDark={isDark} type={t} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="md:col-span-12">
                      <label className={isDark ? "text-xs font-medium text-zinc-300" : "text-xs font-medium text-neutral-700"}>
                        Script / notes (what the AI should say)
                      </label>
                      <textarea
                        className={["mt-1 min-h-[120px] resize-none", inputCls].join(" ")}
                        value={campaignNotes}
                        onChange={(e) => setCampaignNotes(e.target.value)}
                      />
                      <div className={isDark ? "mt-2 text-xs text-zinc-500" : "mt-2 text-xs text-neutral-500"}>
                        Later we’ll generate the final script using the tenant Knowledge Base + MyReceptionist settings and save it with the campaign.
                      </div>
                    </div>

                    <div className="md:col-span-7">
                      <label className={isDark ? "text-xs font-medium text-zinc-300" : "text-xs font-medium text-neutral-700"}>
                        Target audience
                      </label>
                      <select className={["mt-1 w-full", selectCls].join(" ")} value={target} onChange={(e) => setTarget(e.target.value as any)}>
                        <option value="all">All contacts (future)</option>
                        <option value="missed">Missed calls (future)</option>
                        <option value="outboundOnly">Outbound list only (future)</option>
                        <option value="inboundOnly">Inbound callers only (future)</option>
                      </select>
                    </div>

                    <div className="md:col-span-5">
                      <label className={isDark ? "text-xs font-medium text-zinc-300" : "text-xs font-medium text-neutral-700"}>
                        Upsell workflow
                      </label>

                      <div
                        className={[
                          "mt-1 rounded-2xl border p-3",
                          isDark ? "border-white/10 bg-white/5" : "border-neutral-200 bg-neutral-50",
                        ].join(" ")}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeDiscoveryBooking}
                            onChange={(e) => setIncludeDiscoveryBooking(e.target.checked)}
                            className="mt-1 h-4 w-4"
                          />
                          <div>
                            <div className={isDark ? "text-sm text-white" : "text-sm text-neutral-900"}>
                              If interested, book a discovery call
                            </div>
                            <div className={isDark ? "text-xs text-zinc-400" : "text-xs text-neutral-600"}>
                              Later: create Lead + book Calendar event automatically.
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className={["flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between", isDark ? "border-t border-white/10" : "border-t border-neutral-200"].join(" ")}>
                  <div className={isDark ? "text-xs text-zinc-400" : "text-xs text-neutral-600"}>
                    This will run in your dialer queue later. For now it just saves UI selections.
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCampaignOpen(false)}
                      className={[
                        "rounded-xl px-4 py-2 text-sm font-medium ring-1 transition",
                        isDark
                          ? "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
                          : "bg-white text-neutral-900 ring-neutral-200 hover:bg-neutral-50",
                      ].join(" ")}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        // UI only for now
                        alert("UI saved (placeholder). Next step: wire to DB + dialer queue.");
                        setCampaignOpen(false);
                      }}
                      className={[
                        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition",
                        isDark
                          ? "bg-emerald-500 text-white ring-emerald-400/20 hover:bg-emerald-600"
                          : "bg-emerald-600 text-white ring-emerald-600/20 hover:bg-emerald-700",
                      ].join(" ")}
                    >
                      <Sparkles size={16} />
                      Save Campaign
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
