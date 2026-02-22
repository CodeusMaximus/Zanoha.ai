"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  PhoneCall,
  ChevronDown,
  Download,
  Sparkles,
  X,
} from "lucide-react";

type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "negotiating"
  | "converted"
  | "lost";

// ✅ add "zapier" so your webhook leads render cleanly
type LeadSource =
  | "website"
  | "referral"
  | "social"
  | "cold-call"
  | "event"
  | "ad"
  | "zapier"
  | "manual";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  location: string;
  status: LeadStatus;
  source: LeadSource;
  value: number;
  dateAdded: string;
  lastContact?: string;
  notes?: string;
  starred?: boolean;
};

type ApiLead = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  status?: LeadStatus;
  source?: string;
  value?: number;
  createdAt?: string | null;
  lastContact?: string | null;
  notes?: string;
  starred?: boolean;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

const statusColors: Record<
  LeadStatus,
  { bg: string; text: string; ring: string }
> = {
  new: {
    bg: "bg-blue-500/15",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-500/25",
  },
  contacted: {
    bg: "bg-purple-500/15",
    text: "text-purple-700 dark:text-purple-300",
    ring: "ring-purple-500/25",
  },
  qualified: {
    bg: "bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/25",
  },
  negotiating: {
    bg: "bg-orange-500/15",
    text: "text-orange-700 dark:text-orange-300",
    ring: "ring-orange-500/25",
  },
  converted: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500/25",
  },
  lost: {
    bg: "bg-red-500/15",
    text: "text-red-700 dark:text-red-300",
    ring: "ring-red-500/25",
  },
};

const statusLabels: Record<LeadStatus, string> = {
  new: "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  negotiating: "Negotiating",
  converted: "Converted",
  lost: "Lost",
};

// --- Lead purchase types (UI-only)
type LeadPackType = "verified" | "high-intent";
type LeadIndustry =
  | "Barbershop"
  | "Dentist"
  | "Realtor"
  | "Contractor"
  | "Restaurant"
  | "Auto Shop"
  | "Med Spa";

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function safeIso(d?: string | null) {
  if (!d) return new Date().toISOString();
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
}

function normalizeSource(s?: string): LeadSource {
  const raw = (s || "").toLowerCase().trim();
  const allowed: LeadSource[] = [
    "website",
    "referral",
    "social",
    "cold-call",
    "event",
    "ad",
    "zapier",
    "manual",
  ];
  if (allowed.includes(raw as LeadSource)) return raw as LeadSource;
  // if you stored something else, bucket it
  return raw ? "manual" : "zapier";
}

function toUiLead(a: ApiLead): Lead {
  return {
    id: a._id,
    name: a.name || "(No name)",
    email: a.email || "",
    phone: a.phone || "",
    company: a.company || undefined,
    location: a.location || "—",
    status: a.status || "new",
    source: normalizeSource(a.source),
    value: typeof a.value === "number" ? a.value : 0,
    dateAdded: safeIso(a.createdAt),
    lastContact: a.lastContact ? safeIso(a.lastContact) : undefined,
    notes: a.notes || undefined,
    starred: !!a.starred,
  };
}

export default function LeadsPage() {
  // Dark mode observer
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  // Filters & actions
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
  const [aiCalling, setAiCalling] = useState(false);
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);

  // ✅ NEW: Load real leads from Mongo
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string>("");
  const [leads, setLeads] = useState<Lead[]>([]);

  async function fetchLeads() {
    setLoadErr("");
    setLoading(true);
    try {
      const r = await fetch("/api/leads", { cache: "no-store" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Failed to load leads");
      const rows: ApiLead[] = Array.isArray(data?.leads) ? data.leads : [];
      setLeads(rows.map(toUiLead));
    } catch (e: any) {
      setLoadErr(e?.message || "Failed to load leads");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  // --- Buy Leads modal state (UI-only)
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyForm, setBuyForm] = useState<{
    industry: LeadIndustry;
    city: string;
    quantity: 50 | 100 | 250 | 500;
    type: LeadPackType;
  }>({
    industry: "Barbershop",
    city: "",
    quantity: 50,
    type: "verified",
  });

  const pricePerLead = buyForm.type === "high-intent" ? 0.35 : 0.2;
  const totalPrice = +(buyForm.quantity * pricePerLead).toFixed(2);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.company?.toLowerCase().includes(q) ||
        lead.location.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;
      const matchesSource =
        sourceFilter === "all" || lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, searchQuery, statusFilter, sourceFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter((l) => l.status === "new").length;
    const converted = leads.filter((l) => l.status === "converted").length;
    const totalValue = leads.reduce((sum, l) => sum + l.value, 0);
    return { total, newLeads, converted, totalValue };
  }, [leads]);

  // Handlers (still UI-only for now)
  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    alert(
      `Status changed to: ${statusLabels[newStatus]}\n\n(UI only) If you want, we’ll wire: PATCH /api/leads/${leadId}`
    );
  };

  const handleAiCall = (leadId: string, leadName: string) => {
    setCallingLeadId(leadId);
    alert(
      `🤖 AI Call initiated for ${leadName}\n\n(UI only) Wire to your Twilio/AI calling action.`
    );
    setTimeout(() => setCallingLeadId(null), 2000);
  };

  const handleAiCallAll = () => {
    setAiCalling(true);
    alert(
      `🤖 AI calling all ${filteredLeads.length} leads!\n\n(UI only) Wire to your bulk call job.`
    );
    setTimeout(() => setAiCalling(false), 3000);
  };

  // UI-only purchased leads generator (does NOT write to Mongo yet)
  function generatePurchasedLeads() {
    const city = buyForm.city.trim() || "Selected City";
    const industry = buyForm.industry;

    const templates = [
      { first: "Alex", last: "Rivera" },
      { first: "Nia", last: "Johnson" },
      { first: "Omar", last: "Williams" },
      { first: "Sofia", last: "Martinez" },
      { first: "Jordan", last: "Brown" },
      { first: "Ava", last: "Davis" },
      { first: "Noah", last: "Miller" },
      { first: "Maya", last: "Wilson" },
      { first: "Ethan", last: "Moore" },
      { first: "Layla", last: "Taylor" },
    ];

    const newOnes: Lead[] = Array.from({ length: buyForm.quantity }).map(
      (_, i) => {
        const t = templates[i % templates.length];
        const id = `p_${Date.now()}_${i}`;
        const name = `${t.first} ${t.last}`;
        const email = `${t.first.toLowerCase()}.${t.last.toLowerCase()}${i}@example.com`;
        const phone = `+1 (555) ${String(100 + (i % 900)).padStart(
          3,
          "0"
        )}-${String(1000 + (i % 9000)).padStart(4, "0")}`;

        const value =
          buyForm.type === "high-intent"
            ? 12000 + ((i * 317) % 18000)
            : 6000 + ((i * 241) % 12000);

        return {
          id,
          name,
          email,
          phone,
          company: `${industry} Prospect`,
          location: city,
          status: "new",
          source: "ad",
          value,
          dateAdded: new Date().toISOString(),
          notes:
            buyForm.type === "high-intent"
              ? "High-intent lead (UI placeholder)."
              : "Verified lead (UI placeholder).",
          starred: buyForm.type === "high-intent",
        };
      }
    );

    return newOnes;
  }

  const handlePurchase = () => {
    const newLeads = generatePurchasedLeads();
    setLeads((prev) => [...newLeads, ...prev]);

    alert(
      `✅ Purchased ${buyForm.quantity} ${
        buyForm.type === "high-intent" ? "High Intent" : "Verified"
      } leads\nIndustry: ${buyForm.industry}\nCity: ${
        buyForm.city.trim() || "Selected City"
      }\nTotal: $${totalPrice}\n\n(UI only) Next: Stripe + /api/leads/purchase -> Mongo.`
    );

    setShowBuyModal(false);
  };

  // Styling
  const shell = cx(
    "min-h-[calc(100vh-64px)] flex flex-col transition-colors",
    isDark ? "bg-[#0b0f17] text-white" : "bg-neutral-50 text-neutral-900"
  );

  const panel = cx(
    "rounded-2xl border transition-colors",
    isDark ? "border-white/10 bg-white/[0.03]" : "border-neutral-200 bg-white"
  );

  const input = cx(
    "w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors",
    isDark
      ? "border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-white/20"
      : "border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300"
  );

  const btn = (variant: "primary" | "ghost") =>
    cx(
      "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition",
      variant === "primary"
        ? isDark
          ? "bg-white/10 text-white ring-white/15 hover:bg-white/15"
          : "bg-neutral-900 text-white ring-neutral-900/10 hover:bg-neutral-800"
        : isDark
        ? "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
        : "bg-white text-neutral-900 ring-neutral-200 hover:bg-neutral-50"
    );

  return (
    <div className={shell}>
      <div className="mx-auto w-full max-w-[1600px] px-6 py-8 flex flex-col flex-1">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1
              className={cx(
                "text-3xl font-bold tracking-tight",
                isDark ? "text-white" : "text-neutral-900"
              )}
            >
              Lead Management
            </h1>
            <p
              className={cx(
                "mt-2 text-sm",
                isDark ? "text-zinc-400" : "text-neutral-600"
              )}
            >
              Track, manage, and convert your leads with AI-powered automation.
            </p>

            {/* ✅ Load state */}
            <div className="mt-3 flex items-center gap-2">
              {loading ? (
                <div
                  className={cx(
                    "text-xs rounded-full px-2 py-1 ring-1",
                    isDark
                      ? "text-zinc-300 ring-white/10 bg-white/5"
                      : "text-neutral-700 ring-neutral-200 bg-neutral-50"
                  )}
                >
                  Loading leads…
                </div>
              ) : loadErr ? (
                <div className="flex items-center gap-2">
                  <div
                    className={cx(
                      "text-xs rounded-full px-2 py-1 ring-1",
                      isDark
                        ? "text-red-200 ring-red-500/20 bg-red-500/10"
                        : "text-red-700 ring-red-200 bg-red-50"
                    )}
                  >
                    {loadErr}
                  </div>
                  <button className={btn("ghost")} onClick={fetchLeads}>
                    Retry
                  </button>
                </div>
              ) : (
                <div
                  className={cx(
                    "text-xs rounded-full px-2 py-1 ring-1",
                    isDark
                      ? "text-emerald-200 ring-emerald-500/20 bg-emerald-500/10"
                      : "text-emerald-700 ring-emerald-200 bg-emerald-50"
                  )}
                >
                  Live data connected
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              className={btn("primary")}
              onClick={() => setShowBuyModal(true)}
            >
              💎 Buy Leads
            </button>

            <button
              className={btn("ghost")}
              onClick={handleAiCallAll}
              disabled={aiCalling || filteredLeads.length === 0}
            >
              <Sparkles size={16} />
              {aiCalling ? "Calling..." : `AI Call All (${filteredLeads.length})`}
            </button>

            <button className={btn("ghost")}>
              <Download size={16} /> Export
            </button>

            <button className={btn("ghost")}>
              <Phone size={16} /> Add Lead
            </button>

            <button className={btn("ghost")} onClick={fetchLeads}>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={cx(panel, "p-4")}>
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={cx(
                    "text-xs font-semibold",
                    isDark ? "text-zinc-400" : "text-neutral-600"
                  )}
                >
                  Total Leads
                </div>
                <div
                  className={cx(
                    "text-2xl font-bold mt-1",
                    isDark ? "text-white" : "text-neutral-900"
                  )}
                >
                  {stats.total}
                </div>
              </div>
              <Users
                className={cx(
                  "w-8 h-8",
                  isDark ? "text-zinc-600" : "text-neutral-300"
                )}
              />
            </div>
          </div>

          <div className={cx(panel, "p-4")}>
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={cx(
                    "text-xs font-semibold",
                    isDark ? "text-zinc-400" : "text-neutral-600"
                  )}
                >
                  New Leads
                </div>
                <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                  {stats.newLeads}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className={cx(panel, "p-4")}>
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={cx(
                    "text-xs font-semibold",
                    isDark ? "text-zinc-400" : "text-neutral-600"
                  )}
                >
                  Converted
                </div>
                <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {stats.converted}
                </div>
              </div>
              <Star className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          <div className={cx(panel, "p-4")}>
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={cx(
                    "text-xs font-semibold",
                    isDark ? "text-zinc-400" : "text-neutral-600"
                  )}
                >
                  Total Value
                </div>
                <div className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                  ${(stats.totalValue / 1000).toFixed(0)}k
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6">
          <div className={cx(panel, "p-4")}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 relative">
                <Search
                  size={16}
                  className={cx(
                    "absolute left-3 top-1/2 -translate-y-1/2",
                    isDark ? "text-zinc-400" : "text-neutral-500"
                  )}
                />
                <input
                  type="text"
                  placeholder="Search leads by name, email, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cx(input, "pl-9")}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={input}
              >
                <option value="all">All Statuses</option>
                <option value="new">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="negotiating">Negotiating</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className={input}
              >
                <option value="all">All Sources</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social">Social Media</option>
                <option value="cold-call">Cold Call</option>
                <option value="event">Event</option>
                <option value="ad">Advertisement</option>
                <option value="zapier">Zapier</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="mt-6 flex-1 flex flex-col min-h-0">
          <div className={cx(panel, "overflow-hidden flex-1 flex flex-col")}>
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead
                  className={cx(
                    "border-b",
                    isDark ? "border-white/10" : "border-neutral-200"
                  )}
                >
                  <tr>
                    <th
                      className={cx(
                        "text-left px-4 py-3 text-xs font-semibold",
                        isDark ? "text-zinc-400" : "text-neutral-600"
                      )}
                    >
                      Lead
                    </th>
                    <th
                      className={cx(
                        "text-left px-4 py-3 text-xs font-semibold",
                        isDark ? "text-zinc-400" : "text-neutral-600"
                      )}
                    >
                      Contact
                    </th>
                    <th
                      className={cx(
                        "text-left px-4 py-3 text-xs font-semibold",
                        isDark ? "text-zinc-400" : "text-neutral-600"
                      )}
                    >
                      Status
                    </th>
                    <th
                      className={cx(
                        "text-left px-4 py-3 text-xs font-semibold",
                        isDark ? "text-zinc-400" : "text-neutral-600"
                      )}
                    >
                      Value
                    </th>
                    <th
                      className={cx(
                        "text-left px-4 py-3 text-xs font-semibold",
                        isDark ? "text-zinc-400" : "text-neutral-600"
                      )}
                    >
                      Source
                    </th>
                    <th
                      className={cx(
                        "text-left px-4 py-3 text-xs font-semibold",
                        isDark ? "text-zinc-400" : "text-neutral-600"
                      )}
                    >
                      Last Contact
                    </th>
                    <th
                      className={cx(
                        "text-left px-4 py-3 text-xs font-semibold",
                        isDark ? "text-zinc-400" : "text-neutral-600"
                      )}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div
                          className={cx(
                            "text-sm",
                            isDark ? "text-zinc-400" : "text-neutral-600"
                          )}
                        >
                          Loading leads…
                        </div>
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div
                          className={cx(
                            "text-sm",
                            isDark ? "text-zinc-400" : "text-neutral-600"
                          )}
                        >
                          No leads found matching your filters.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className={cx(
                          "border-b transition-colors",
                          isDark
                            ? "border-white/5 hover:bg-white/[0.02]"
                            : "border-neutral-100 hover:bg-neutral-50"
                        )}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {lead.starred && (
                              <Star
                                size={14}
                                className="text-amber-500 fill-amber-500"
                              />
                            )}
                            <div>
                              <div
                                className={cx(
                                  "font-semibold text-sm",
                                  isDark ? "text-white" : "text-neutral-900"
                                )}
                              >
                                {lead.name}
                              </div>
                              {lead.company && (
                                <div
                                  className={cx(
                                    "text-xs mt-0.5",
                                    isDark
                                      ? "text-zinc-400"
                                      : "text-neutral-600"
                                  )}
                                >
                                  {lead.company}
                                </div>
                              )}
                              <div
                                className={cx(
                                  "text-xs mt-0.5 flex items-center gap-1",
                                  isDark
                                    ? "text-zinc-500"
                                    : "text-neutral-500"
                                )}
                              >
                                <MapPin size={10} />
                                {lead.location}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div
                              className={cx(
                                "text-xs flex items-center gap-1.5",
                                isDark
                                  ? "text-zinc-300"
                                  : "text-neutral-700"
                              )}
                            >
                              <Mail size={12} />
                              {lead.email || "—"}
                            </div>
                            <div
                              className={cx(
                                "text-xs flex items-center gap-1.5",
                                isDark
                                  ? "text-zinc-300"
                                  : "text-neutral-700"
                              )}
                            >
                              <Phone size={12} />
                              {lead.phone || "—"}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="relative inline-block">
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  lead.id,
                                  e.target.value as LeadStatus
                                )
                              }
                              className={cx(
                                "appearance-none rounded-full px-3 py-1.5 pr-8 text-xs font-semibold ring-1 cursor-pointer transition-colors",
                                statusColors[lead.status].bg,
                                statusColors[lead.status].text,
                                statusColors[lead.status].ring,
                                isDark ? "bg-opacity-20" : ""
                              )}
                            >
                              <option value="new">New Lead</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="negotiating">Negotiating</option>
                              <option value="converted">Converted</option>
                              <option value="lost">Lost</option>
                            </select>
                            <ChevronDown
                              size={14}
                              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                            />
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div
                            className={cx(
                              "text-sm font-semibold",
                              isDark ? "text-white" : "text-neutral-900"
                            )}
                          >
                            ${fmtMoney(lead.value)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div
                            className={cx(
                              "text-xs capitalize",
                              isDark ? "text-zinc-400" : "text-neutral-600"
                            )}
                          >
                            {lead.source.replace("-", " ")}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div
                            className={cx(
                              "text-xs flex items-center gap-1.5",
                              isDark ? "text-zinc-400" : "text-neutral-600"
                            )}
                          >
                            <Clock size={12} />
                            {lead.lastContact
                              ? new Date(lead.lastContact).toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "numeric" }
                                )
                              : "Never"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAiCall(lead.id, lead.name)}
                              disabled={callingLeadId === lead.id}
                              className={cx(
                                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition-all",
                                callingLeadId === lead.id
                                  ? isDark
                                    ? "bg-blue-500/20 text-blue-300 ring-blue-500/30 cursor-wait"
                                    : "bg-blue-100 text-blue-600 ring-blue-200 cursor-wait"
                                  : isDark
                                  ? "bg-blue-500/10 text-blue-400 ring-blue-500/20 hover:bg-blue-500/15"
                                  : "bg-blue-50 text-blue-600 ring-blue-200 hover:bg-blue-100"
                              )}
                            >
                              <PhoneCall
                                size={14}
                                className={
                                  callingLeadId === lead.id
                                    ? "animate-pulse"
                                    : ""
                                }
                              />
                              {callingLeadId === lead.id
                                ? "Calling..."
                                : "AI Call"}
                            </button>

                            <button className={btn("ghost") + " px-2"}>
                              <Mail size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Leads Modal (UI-only) */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className={cx("w-full max-w-lg rounded-2xl p-5 md:p-6", panel)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  className={cx(
                    "text-xl font-bold",
                    isDark ? "text-white" : "text-neutral-900"
                  )}
                >
                  Buy Leads
                </h2>
                <p
                  className={cx(
                    "mt-1 text-sm",
                    isDark ? "text-zinc-400" : "text-neutral-600"
                  )}
                >
                  Purchase leads and deliver them directly into your CRM.
                </p>
              </div>

              <button
                onClick={() => setShowBuyModal(false)}
                className={cx(
                  "rounded-xl p-2 ring-1 transition",
                  isDark
                    ? "bg-white/5 ring-white/10 hover:bg-white/10"
                    : "bg-white ring-neutral-200 hover:bg-neutral-50"
                )}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div
                  className={cx(
                    "text-xs font-semibold mb-1",
                    isDark ? "text-zinc-400" : "text-neutral-600"
                  )}
                >
                  Industry
                </div>
                <select
                  className={input}
                  value={buyForm.industry}
                  onChange={(e) =>
                    setBuyForm((p) => ({
                      ...p,
                      industry: e.target.value as LeadIndustry,
                    }))
                  }
                >
                  <option>Barbershop</option>
                  <option>Dentist</option>
                  <option>Realtor</option>
                  <option>Contractor</option>
                  <option>Restaurant</option>
                  <option>Auto Shop</option>
                  <option>Med Spa</option>
                </select>
              </div>

              <div>
                <div
                  className={cx(
                    "text-xs font-semibold mb-1",
                    isDark ? "text-zinc-400" : "text-neutral-600"
                  )}
                >
                  City
                </div>
                <input
                  className={input}
                  placeholder="e.g., Staten Island, NY"
                  value={buyForm.city}
                  onChange={(e) =>
                    setBuyForm((p) => ({ ...p, city: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div
                    className={cx(
                      "text-xs font-semibold mb-1",
                      isDark ? "text-zinc-400" : "text-neutral-600"
                    )}
                  >
                    Quantity
                  </div>
                  <select
                    className={input}
                    value={buyForm.quantity}
                    onChange={(e) =>
                      setBuyForm((p) => ({
                        ...p,
                        quantity: Number(e.target.value) as any,
                      }))
                    }
                  >
                    <option value={50}>50 leads</option>
                    <option value={100}>100 leads</option>
                    <option value={250}>250 leads</option>
                    <option value={500}>500 leads</option>
                  </select>
                </div>

                <div>
                  <div
                    className={cx(
                      "text-xs font-semibold mb-1",
                      isDark ? "text-zinc-400" : "text-neutral-600"
                    )}
                  >
                    Lead Type
                  </div>
                  <select
                    className={input}
                    value={buyForm.type}
                    onChange={(e) =>
                      setBuyForm((p) => ({
                        ...p,
                        type: e.target.value as LeadPackType,
                      }))
                    }
                  >
                    <option value="verified">Verified ($0.20/lead)</option>
                    <option value="high-intent">
                      High Intent ($0.35/lead)
                    </option>
                  </select>
                </div>
              </div>

              <div
                className={cx(
                  "rounded-2xl p-4 ring-1 flex items-center justify-between",
                  isDark
                    ? "bg-white/5 ring-white/10"
                    : "bg-neutral-50 ring-neutral-200"
                )}
              >
                <div>
                  <div
                    className={cx(
                      "text-xs font-semibold",
                      isDark ? "text-zinc-400" : "text-neutral-600"
                    )}
                  >
                    Total
                  </div>
                  <div
                    className={cx(
                      "text-xs mt-1",
                      isDark ? "text-zinc-500" : "text-neutral-500"
                    )}
                  >
                    {buyForm.quantity} leads × ${pricePerLead.toFixed(2)}/lead
                  </div>
                </div>
                <div
                  className={cx(
                    "text-2xl font-bold",
                    isDark ? "text-white" : "text-neutral-900"
                  )}
                >
                  ${totalPrice.toFixed(2)}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowBuyModal(false)}
                  className={btn("ghost") + " w-full"}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  className={btn("primary") + " w-full"}
                >
                  Purchase & Deliver
                </button>
              </div>

              <div
                className={cx(
                  "text-xs leading-relaxed",
                  isDark ? "text-zinc-500" : "text-neutral-500"
                )}
              >
                This is currently <span className="font-semibold">UI-only</span>.
                Next step is wiring this to{" "}
                <span className="font-semibold">Stripe</span> + a{" "}
                <span className="font-semibold">/api/leads/purchase</span> route
                that writes leads to MongoDB under the tenant/business.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
