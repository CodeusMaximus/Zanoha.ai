"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton, UserProfile, useUser } from "@clerk/nextjs";

type SettingsTab =
  | "business"
  | "profile"
  | "billing"
  | "notifications"
  | "services" // ← ADDED
  | "security"
  | "preferences";

type DayHours = { day: string; enabled: boolean; open: string; close: string };

type Department = {
  id: string; // stable key for edits/reordering
  name: string;
  description: string;
  enabled: boolean;
  publicPhone?: string; // optional (not routing yet)
  hoursNote?: string; // optional (e.g., "Mon–Fri 9–5")
  forwardingNumber?: string; // (optional for later routing)
};

// ✅ SERVICES TYPE (ADDED)
type ServiceItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  enabled: boolean;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * ✅ Input focus bug fix:
 * Move UI subcomponents OUTSIDE SettingsPage so they don’t get recreated
 * and (in some setups with motion/layout keys) don’t cause remounts/focus loss.
 */
function SectionCard({
  title,
  subtitle,
  children,
  isDarkMode,
  MutedText,
}: {
  title: string;
  subtitle?: string;
  children: any;
  isDarkMode: boolean;
  MutedText: string;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border p-6",
        isDarkMode
          ? "bg-neutral-950/30 border-neutral-800"
          : "bg-neutral-50 border-neutral-200"
      )}
    >
      <div className="mb-4">
        <div className="text-lg font-semibold">{title}</div>
        {subtitle && <div className={cx("text-sm mt-1", MutedText)}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  isDarkMode,
  MutedText,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  isDarkMode: boolean;
  MutedText: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-4 rounded-xl border p-4",
        isDarkMode ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white"
      )}
    >
      <div>
        <div className="font-medium">{label}</div>
        {hint && <div className={cx("text-sm mt-1", MutedText)}>{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cx(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-emerald-500" : isDarkMode ? "bg-neutral-700" : "bg-neutral-300"
        )}
      >
        <span
          className={cx(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

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

export default function SettingsPage() {
  const { user } = useUser();

  // ✅ Detect theme correctly (doesn't get stuck on dark)
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const isDarkMode = theme === "dark";

  const [activeTab, setActiveTab] = useState<SettingsTab>("business");
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ✅ Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // ✅ Save state
  const [savingBiz, setSavingBiz] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // ✅ Profile state (JSON)
  const [profile, setProfile] = useState({
    displayName: user?.fullName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    phone: user?.primaryPhoneNumber?.phoneNumber || "",
  });
   /* =========================
     ✅ SERVICES STATE (ADDED)
  ========================= */

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceDraft, setServiceDraft] = useState<ServiceItem>({
    id: "",
    name: "",
    description: "",
    price: "",
    enabled: true,
  });


  // Keep profile state in sync if Clerk loads after first render
  useEffect(() => {
    setProfile((p) => ({
      ...p,
      displayName: user?.fullName || p.displayName,
      email: user?.primaryEmailAddress?.emailAddress || p.email,
      phone: user?.primaryPhoneNumber?.phoneNumber || p.phone,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ✅ Business info state (JSON)
  const [businessInfo, setBusinessInfo] = useState({
    businessName: "",
    legalName: "",
    businessType: "salon",
    taxId: "",
    phone: "",
    website: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
    },
  });

  // ✅ Departments (NEW)
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: uid(),
      name: "Appointments",
      description: "Booking, rescheduling, cancellations, and availability.",
      enabled: true,
      publicPhone: "",
      hoursNote: "",
      forwardingNumber: "",
    },
    {
      id: uid(),
      name: "Billing",
      description: "Invoices, payments, receipts, and billing questions.",
      enabled: true,
      publicPhone: "",
      hoursNote: "",
      forwardingNumber: "",
    },
    {
      id: uid(),
      name: "General",
      description: "Anything else—questions, directions, and basic help.",
      enabled: true,
      publicPhone: "",
      hoursNote: "",
      forwardingNumber: "",
    },
  ]);

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  const editingDept = useMemo(() => {
    if (!editingDeptId) return null;
    return departments.find((d) => d.id === editingDeptId) || null;
  }, [departments, editingDeptId]);

  const [deptDraft, setDeptDraft] = useState<Department>({
    id: "",
    name: "",
    description: "",
    enabled: true,
    publicPhone: "",
    hoursNote: "",
    forwardingNumber: "",
  });

  const openCreateDept = useCallback(() => {
    setEditingDeptId(null);
    setDeptDraft({
      id: uid(),
      name: "",
      description: "",
      enabled: true,
      publicPhone: "",
      hoursNote: "",
      forwardingNumber: "",
    });
    setDeptModalOpen(true);
  }, []);

  const openEditDept = useCallback(
    (id: string) => {
      const d = departments.find((x) => x.id === id);
      if (!d) return;
      setEditingDeptId(id);
      setDeptDraft({ ...d });
      setDeptModalOpen(true);
    },
    [departments]
  );

  const saveDeptDraft = useCallback(() => {
    const name = (deptDraft.name || "").trim();
    const description = (deptDraft.description || "").trim();

    if (!name) return alert("Department name is required.");
    if (!description) return alert("Department description is required (1 sentence is fine).");

    setDepartments((prev) => {
      const exists = prev.some((d) => d.id === deptDraft.id);
      if (exists) return prev.map((d) => (d.id === deptDraft.id ? { ...deptDraft, name, description } : d));
      return [{ ...deptDraft, name, description }, ...prev];
    });

    setDeptModalOpen(false);
    setEditingDeptId(null);
  }, [deptDraft]);

  const deleteDept = useCallback(
    (id: string) => {
      const d = departments.find((x) => x.id === id);
      if (!d) return;
      if (!confirm(`Delete department "${d.name}"?`)) return;
      setDepartments((prev) => prev.filter((x) => x.id !== id));
    },
    [departments]
  );

  const moveDept = useCallback((id: string, dir: -1 | 1) => {
    setDepartments((prev) => {
      const i = prev.findIndex((d) => d.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
      return next;
    });
  }, []);

  // ✅ Notifications state (JSON)
  const [notifs, setNotifs] = useState({
    email: { appointmentBooked: true, missedCall: true, dailySummary: false },
    sms: { appointmentBooked: false, missedCall: true },
    slack: { enabled: false, webhookUrl: "" },
  });

  // ✅ Preferences state (JSON)
  const [prefs, setPrefs] = useState({
    timezone: "America/New_York",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    weekStartsOnMonday: false,
    compactMode: false,
  });

  // ✅ Security state (JSON) — password change handled by Clerk
  const [security, setSecurity] = useState({
    mfaEnabled: false,
    loginAlerts: true,
    sessionTimeoutMins: 120,
  });

  const [businessHours, setBusinessHours] = useState<DayHours[]>([
    { day: "Monday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Tuesday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Wednesday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Thursday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Friday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Saturday", enabled: false, open: "09:00", close: "17:00" },
    { day: "Sunday", enabled: false, open: "09:00", close: "17:00" },
  ]);

  // ✅ Fetch existing tenant branding + settings (keep your existing backend)
  useEffect(() => {
    // branding
    fetch("/api/tenant/branding")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setLogoUrl(d.branding?.logoUrl || null);
      })
      .catch(() => {});

    // settings (if your backend already exists)
    fetch("/api/tenant/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok || !d?.settings) return;
        const s = d.settings;
        if (s.businessInfo) setBusinessInfo(s.businessInfo);
        if (Array.isArray(s.businessHours)) setBusinessHours(s.businessHours);
        if (Array.isArray(s.departments)) setDepartments(s.departments);
        if (Array.isArray(s.services)) setServices(s.services); // ✅
        if (s.branding?.logoUrl) setLogoUrl(s.branding.logoUrl);
      })
      .catch(() => {});
  }, []);

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/tenant/logo", { method: "POST", body: fd });

      const parsed = await safeJson<{ ok: boolean; logoUrl?: string; error?: string }>(res);
      if (!parsed.ok || !parsed.data?.ok) throw new Error(parsed.error || parsed.data?.error || "Upload failed");

      setLogoUrl(parsed.data.logoUrl || null);
    } catch (e: any) {
      alert(e?.message || "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  async function removeLogo() {
    setLogoUploading(true);
    try {
      const res = await fetch("/api/tenant/logo", { method: "DELETE" });

      const parsed = await safeJson<{ ok: boolean; error?: string }>(res);
      if (!parsed.ok || !parsed.data?.ok) throw new Error(parsed.error || parsed.data?.error || "Remove failed");

      setLogoUrl(null);
    } catch (e: any) {
      alert(e?.message || "Remove failed");
    } finally {
      setLogoUploading(false);
    }
  }

  // ✅ Robust theme detection (supports: .dark class OR next-themes data-theme)
  useEffect(() => {
    const root = document.documentElement;

    const readTheme = () => {
      const isDarkByClass = root.classList.contains("dark");
      const dataTheme = root.getAttribute("data-theme");
      const isDarkByData = dataTheme === "dark";
      setTheme(isDarkByClass || isDarkByData ? "dark" : "light");
    };

    readTheme();

    const obs = new MutationObserver(readTheme);
    obs.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMql = () => readTheme();
    mql?.addEventListener?.("change", onMql);

    return () => {
      obs.disconnect();
      mql?.removeEventListener?.("change", onMql);
    };
  }, []);

  const tabs = useMemo(
    () =>
      [
        { id: "business", label: "Business Information", icon: "🏢" },
        { id: "profile", label: "Account", icon: "👤" },
        { id: "billing", label: "Billing & Subscription", icon: "💳" },
         { id: "services", label: "Services", icon: "🧾" }, // ✅ ADDED
        { id: "notifications", label: "Notifications", icon: "🔔" },
        { id: "security", label: "Security", icon: "🔒" },
        { id: "preferences", label: "Preferences", icon: "⚙️" },
      ] as const,
    []
  );

  const ShellBg = isDarkMode ? "bg-neutral-950 text-white" : "bg-neutral-50 text-neutral-900";
  const CardBg = isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200";
  const MutedText = isDarkMode ? "text-neutral-400" : "text-neutral-600";
  const SubtleBorder = isDarkMode ? "border-neutral-800" : "border-neutral-200";
  const InputBg = isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-300";

  async function saveBusiness() {
    // ✅ keep your backend saving behavior
    setSavingBiz(true);
    try {
      const payload = {
        businessInfo,
        businessHours,
        departments,
        services,           
         branding: { logoUrl },
      };

      const res = await fetch("/api/tenant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const parsed = await safeJson<{ ok: boolean; error?: string }>(res);
      if (!parsed.ok || !parsed.data?.ok) throw new Error(parsed.error || parsed.data?.error || "Save failed");

      alert("Saved.");
    } catch (e: any) {
      alert(e?.message || "Save failed");
    } finally {
      setSavingBiz(false);
    }
  }

  async function saveNotifications() {
    setSavingNotifs(true);
    try {
      // keep your flow
      console.log("SAVE notifications JSON:", notifs);
      alert("Saved (wire API next).");
    } catch (e: any) {
      alert(e?.message || "Save failed");
    } finally {
      setSavingNotifs(false);
    }
  }

  async function savePreferences() {
    setSavingPrefs(true);
    try {
      // keep your flow
      console.log("SAVE preferences JSON:", prefs);
      alert("Saved (wire API next).");
    } catch (e: any) {
      alert(e?.message || "Save failed");
    } finally {
      setSavingPrefs(false);
    }
  }

  return (
    <div className={cx("min-h-screen transition-colors duration-200", ShellBg)}>
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Settings</h1>
            <p className={cx("text-sm", MutedText)}>
              Manage your business, account, billing, notifications, and security.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={cx("rounded-xl border px-3 py-2", CardBg)}>
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/" />
                <div className="text-xs">
                  <div className="font-semibold">{user?.fullName || "Account"}</div>
                  <div className={MutedText}>{user?.primaryEmailAddress?.emailAddress || ""}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Tabs */}
        <div className={cx("mb-6 p-2 rounded-xl border overflow-x-auto", CardBg)}>
          <nav className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={cx(
                  "flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? isDarkMode
                      ? "bg-white text-neutral-900"
                      : "bg-neutral-900 text-white"
                    : isDarkMode
                    ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                )}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className={cx("p-8 rounded-xl border", CardBg)}>
          {/* =========================
              ✅ BUSINESS TAB
             ========================= */}
          {activeTab === "business" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Business Information</h2>
                <p className={cx("text-sm", MutedText)}>
                  Store everything as JSON: branding, profile, address, hours, departments, and operational preferences.
                </p>
              </div>

              {/* Branding */}
              <SectionCard
                title="Branding"
                subtitle="Upload a logo for sidebar + client-facing pages."
                isDarkMode={isDarkMode}
                MutedText={MutedText}
              >
                <div className={cx("rounded-2xl border overflow-hidden", isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}>
                  <div className="p-5">
                    <div className={cx("relative w-full rounded-2xl overflow-hidden ring-1", isDarkMode ? "bg-neutral-950 ring-white/10" : "bg-neutral-50 ring-black/10")}>
                      <div className="h-[200px] md:h-[240px] w-full">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="Tenant logo" className="h-full w-full object-contain p-6" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <div className={cx("text-sm font-semibold", isDarkMode ? "text-white/60" : "text-neutral-700")}>
                              Logo preview
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium ring-1 backdrop-blur bg-black/30 text-white ring-white/15">
                        Sidebar Branding
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="font-semibold">Tenant Logo</div>
                      <div className={cx("text-sm", MutedText)}>Used in sidebar header and optional client pages.</div>
                      <div className="text-xs mt-1 text-neutral-500">PNG/JPG/WEBP/SVG • max 2MB • best: transparent PNG or SVG</div>
                    </div>
                  </div>

                  <div className={cx("px-5 py-4 border-t flex flex-col md:flex-row md:items-center gap-3", SubtleBorder)}>
                    <div className="flex gap-2">
                      <label
                        className={cx(
                          "px-4 py-2.5 rounded-lg font-medium cursor-pointer transition-colors",
                          isDarkMode ? "bg-neutral-700 hover:bg-neutral-600 text-white" : "bg-neutral-900 hover:bg-neutral-800 text-white",
                          logoUploading && "opacity-60 pointer-events-none"
                        )}
                      >
                        {logoUploading ? "Uploading..." : "Upload Logo"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadLogo(f);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={removeLogo}
                        disabled={!logoUrl || logoUploading}
                        className={cx(
                          "px-4 py-2.5 rounded-lg font-medium transition-colors",
                          !logoUrl || logoUploading
                            ? isDarkMode
                              ? "bg-neutral-800 text-neutral-500"
                              : "bg-neutral-200 text-neutral-500"
                            : isDarkMode
                            ? "border border-red-500/20 text-red-300 hover:bg-red-500/10"
                            : "border border-red-500/30 text-red-600 hover:bg-red-50"
                        )}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex-1" />
                    <div className={cx("text-xs", MutedText)}>Tip: square logos look best.</div>
                  </div>
                </div>
              </SectionCard>

              {/* Basic Info */}
              <SectionCard
                title="Basic Information"
                subtitle="This should update the businesses document (JSON)."
                isDarkMode={isDarkMode}
                MutedText={MutedText}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={businessInfo.businessName}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, businessName: e.target.value }))}
                      className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="Acme Inc."
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>
                      Legal Name
                    </label>
                    <input
                      type="text"
                      value={businessInfo.legalName}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, legalName: e.target.value }))}
                      className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="Acme Incorporated"
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>
                      Business Type
                    </label>
                    <select
                      value={businessInfo.businessType}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, businessType: e.target.value }))}
                      className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                    >
                      <option value="salon">Salon/Spa</option>
                      <option value="medical">Medical/Dental</option>
                      <option value="legal">Legal Services</option>
                      <option value="consulting">Consulting</option>
                      <option value="retail">Retail</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>
                      Tax ID / EIN
                    </label>
                    <input
                      type="text"
                      value={businessInfo.taxId}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, taxId: e.target.value }))}
                      className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="XX-XXXXXXX"
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>
                      Business Phone
                    </label>
                    <input
                      type="tel"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, phone: e.target.value }))}
                      className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="(555) 555-5555"
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>
                      Website
                    </label>
                    <input
                      type="url"
                      value={businessInfo.website}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, website: e.target.value }))}
                      className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className={cx("mt-6 rounded-2xl border p-5", isDarkMode ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white")}>
                  <div className="font-semibold mb-3">Address</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      value={businessInfo.address.line1}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, address: { ...p.address, line1: e.target.value } }))}
                      className={cx("px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="Line 1"
                    />
                    <input
                      value={businessInfo.address.line2}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, address: { ...p.address, line2: e.target.value } }))}
                      className={cx("px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="Line 2 (optional)"
                    />
                    <input
                      value={businessInfo.address.city}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, address: { ...p.address, city: e.target.value } }))}
                      className={cx("px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="City"
                    />
                    <input
                      value={businessInfo.address.state}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, address: { ...p.address, state: e.target.value } }))}
                      className={cx("px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="State"
                    />
                    <input
                      value={businessInfo.address.zip}
                      onChange={(e) => setBusinessInfo((p) => ({ ...p, address: { ...p.address, zip: e.target.value } }))}
                      className={cx("px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="ZIP"
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Departments (JSON-driven) */}
              <SectionCard
                title="Departments"
                subtitle="JSON-driven. The receptionist will read this info on calls. Routing comes later."
                isDarkMode={isDarkMode}
                MutedText={MutedText}
              >
                <div className={cx("rounded-2xl border overflow-hidden", isDarkMode ? "border-neutral-800 bg-neutral-950/20" : "border-neutral-200 bg-white")}>
                  <div className={cx("px-5 py-4 border-b flex items-center justify-between", SubtleBorder)}>
                    <div>
                      <div className="font-semibold">Call Handling Menu</div>
                      <div className={cx("text-xs mt-1", MutedText)}>
                        Example: “We’ve got Billing, Appointments, and General Support — which one did you need?”
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openCreateDept}
                      className={cx(
                        "px-4 py-2.5 rounded-lg font-medium transition-colors",
                        isDarkMode ? "bg-white text-neutral-900 hover:bg-neutral-100" : "bg-neutral-900 text-white hover:bg-neutral-800"
                      )}
                    >
                      + Add Department
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    {departments.length === 0 ? (
                      <div className={cx("text-sm", MutedText)}>No departments yet. Add one.</div>
                    ) : (
                      departments.map((d, idx) => (
                        <div
                          key={d.id}
                          className={cx("rounded-xl border p-4", isDarkMode ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white")}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold truncate">{d.name}</div>
                                <span
                                  className={cx(
                                    "text-[11px] px-2 py-0.5 rounded-full border",
                                    d.enabled
                                      ? isDarkMode
                                        ? "border-emerald-500/30 text-emerald-300"
                                        : "border-emerald-600/30 text-emerald-700"
                                      : isDarkMode
                                      ? "border-neutral-700 text-neutral-400"
                                      : "border-neutral-300 text-neutral-500"
                                  )}
                                >
                                  {d.enabled ? "Enabled" : "Disabled"}
                                </span>
                              </div>

                              <div className={cx("text-sm mt-1", MutedText)}>{d.description}</div>

                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className={cx("rounded-lg border p-3", isDarkMode ? "border-neutral-800 bg-neutral-950/30" : "border-neutral-200 bg-neutral-50")}>
                                  <div className={cx("text-xs font-semibold", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Public phone (optional)</div>
                                  <div className={cx("text-xs mt-1", MutedText)}>{d.publicPhone?.trim() ? d.publicPhone : "—"}</div>
                                </div>
                                <div className={cx("rounded-lg border p-3", isDarkMode ? "border-neutral-800 bg-neutral-950/30" : "border-neutral-200 bg-neutral-50")}>
                                  <div className={cx("text-xs font-semibold", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Hours note (optional)</div>
                                  <div className={cx("text-xs mt-1", MutedText)}>{d.hoursNote?.trim() ? d.hoursNote : "—"}</div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => moveDept(d.id, -1)}
                                  disabled={idx === 0}
                                  className={cx(
                                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    idx === 0
                                      ? isDarkMode
                                        ? "bg-neutral-900 text-neutral-600 border border-neutral-800"
                                        : "bg-neutral-100 text-neutral-400 border border-neutral-200"
                                      : isDarkMode
                                      ? "bg-neutral-800 hover:bg-neutral-700"
                                      : "bg-neutral-200 hover:bg-neutral-300"
                                  )}
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveDept(d.id, 1)}
                                  disabled={idx === departments.length - 1}
                                  className={cx(
                                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    idx === departments.length - 1
                                      ? isDarkMode
                                        ? "bg-neutral-900 text-neutral-600 border border-neutral-800"
                                        : "bg-neutral-100 text-neutral-400 border border-neutral-200"
                                      : isDarkMode
                                      ? "bg-neutral-800 hover:bg-neutral-700"
                                      : "bg-neutral-200 hover:bg-neutral-300"
                                  )}
                                >
                                  ↓
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDepartments((prev) => prev.map((x) => (x.id === d.id ? { ...x, enabled: !x.enabled } : x)))
                                  }
                                  className={cx(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    d.enabled
                                      ? isDarkMode
                                        ? "border border-amber-500/20 text-amber-300 hover:bg-amber-500/10"
                                        : "border border-amber-500/30 text-amber-700 hover:bg-amber-50"
                                      : isDarkMode
                                      ? "border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10"
                                      : "border border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
                                  )}
                                >
                                  {d.enabled ? "Disable" : "Enable"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openEditDept(d.id)}
                                  className={cx("px-4 py-2 rounded-lg text-sm font-medium transition-colors", isDarkMode ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300")}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteDept(d.id)}
                                  className={cx(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isDarkMode ? "border border-red-500/20 text-red-300 hover:bg-red-500/10" : "border border-red-500/30 text-red-600 hover:bg-red-50"
                                  )}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className={cx("px-5 py-4 border-t", SubtleBorder)}>
                    <div className={cx("text-xs", MutedText)}>
                      ✅ v1: receptionist reads this data • ⏭️ later: forwarding numbers + live transfer logic
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Hours */}
              <SectionCard
                title="Business Hours"
                subtitle="Hours are stored as JSON (day/enabled/open/close)."
                isDarkMode={isDarkMode}
                MutedText={MutedText}
              >
                <div className={cx("rounded-lg border overflow-hidden", SubtleBorder)}>
                  <table className="w-full">
                    <thead className={isDarkMode ? "bg-neutral-900" : "bg-neutral-50"}>
                      <tr>
                        <th className={cx("px-4 py-3 text-left text-sm font-semibold", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Day</th>
                        <th className={cx("px-4 py-3 text-left text-sm font-semibold", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Status</th>
                        <th className={cx("px-4 py-3 text-left text-sm font-semibold", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Opening</th>
                        <th className={cx("px-4 py-3 text-left text-sm font-semibold", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Closing</th>
                      </tr>
                    </thead>
                    <tbody className={cx("divide-y", isDarkMode ? "divide-neutral-800" : "divide-neutral-200")}>
                      {businessHours.map((day, index) => (
                        <tr key={day.day}>
                          <td className="px-4 py-3 font-medium">{day.day}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                setBusinessHours((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], enabled: !next[index].enabled };
                                  return next;
                                });
                              }}
                              className={cx(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                day.enabled ? "bg-emerald-500" : isDarkMode ? "bg-neutral-700" : "bg-neutral-300"
                              )}
                            >
                              <span className={cx("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", day.enabled ? "translate-x-6" : "translate-x-1")} />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={day.open}
                              disabled={!day.enabled}
                              onChange={(e) => {
                                const value = e.target.value;
                                setBusinessHours((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], open: value };
                                  return next;
                                });
                              }}
                              className={cx(
                                "px-3 py-2 rounded-lg border text-sm",
                                !day.enabled
                                  ? isDarkMode
                                    ? "bg-neutral-900 border-neutral-800 text-neutral-600"
                                    : "bg-neutral-100 border-neutral-200 text-neutral-400"
                                  : InputBg
                              )}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={day.close}
                              disabled={!day.enabled}
                              onChange={(e) => {
                                const value = e.target.value;
                                setBusinessHours((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], close: value };
                                  return next;
                                });
                              }}
                              className={cx(
                                "px-3 py-2 rounded-lg border text-sm",
                                !day.enabled
                                  ? isDarkMode
                                    ? "bg-neutral-900 border-neutral-800 text-neutral-600"
                                    : "bg-neutral-100 border-neutral-200 text-neutral-400"
                                  : InputBg
                              )}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className={cx("px-6 py-3 rounded-lg font-medium transition-colors", isDarkMode ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300")}
                  >
                    Reset Changes
                  </button>
                  <button
                    type="button"
                    onClick={saveBusiness}
                    disabled={savingBiz}
                    className={cx("px-6 py-3 rounded-lg font-medium text-white transition-colors", savingBiz ? "bg-emerald-700/60" : "bg-emerald-500 hover:bg-emerald-600")}
                  >
                    {savingBiz ? "Saving..." : "Save Business Information"}
                  </button>
                </div>
              </SectionCard>
            </div>
          )}
          {activeTab === "services" && (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-1">Products & Services</h2>
      <p className={cx("text-sm", MutedText)}>
        What the receptionist can explain to callers when discussing pricing.
      </p>
    </div>

    <SectionCard
      title="Service List"
      subtitle="Stored as JSON. Human-readable by the AI."
      isDarkMode={isDarkMode}
      MutedText={MutedText}
    >
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => {
            setServiceDraft({
              id: uid(),
              name: "",
              description: "",
              price: "",
              enabled: true,
            });
            setServiceModalOpen(true);
          }}
          className={cx(
            "px-4 py-2.5 rounded-lg font-medium",
            isDarkMode
              ? "bg-white text-neutral-900 hover:bg-neutral-100"
              : "bg-neutral-900 text-white hover:bg-neutral-800"
          )}
        >
          + Add Service
        </button>
      </div>

      <div className="space-y-3">
        {services.length === 0 && (
          <div className={cx("text-sm", MutedText)}>
            No services added yet.
          </div>
        )}

        {services.map((s) => (
          <div
            key={s.id}
            className={cx(
              "rounded-xl border p-4",
              isDarkMode
                ? "border-neutral-800 bg-neutral-900/40"
                : "border-neutral-200 bg-white"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className={cx("text-sm mt-1", MutedText)}>
                  {s.description}
                </div>
                <div className="text-sm mt-2 font-medium">
                  Price: {s.price}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setServices((prev) =>
                      prev.map((x) =>
                        x.id === s.id ? { ...x, enabled: !x.enabled } : x
                      )
                    )
                  }
                  className={cx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    s.enabled
                      ? isDarkMode
                        ? "border border-amber-500/20 text-amber-300 hover:bg-amber-500/10"
                        : "border border-amber-500/30 text-amber-700 hover:bg-amber-50"
                      : isDarkMode
                      ? "border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10"
                      : "border border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
                  )}
                >
                  {s.enabled ? "Disable" : "Enable"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setServiceDraft(s);
                    setServiceModalOpen(true);
                  }}
                  className={cx(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    isDarkMode
                      ? "bg-neutral-800 hover:bg-neutral-700"
                      : "bg-neutral-200 hover:bg-neutral-300"
                  )}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setServices((prev) =>
                      prev.filter((x) => x.id !== s.id)
                    )
                  }
                  className={cx(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    isDarkMode
                      ? "border border-red-500/20 text-red-300 hover:bg-red-500/10"
                      : "border border-red-500/30 text-red-600 hover:bg-red-50"
                  )}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-4">
  <button
    type="button"
    onClick={saveBusiness}
    disabled={savingBiz}
    className={cx(
      "px-6 py-3 rounded-lg font-medium text-white transition-colors",
      savingBiz
        ? "bg-emerald-700/60"
        : "bg-emerald-500 hover:bg-emerald-600"
    )}
  >
    {savingBiz ? "Saving..." : "Save Services"}
  </button>
</div>

    </SectionCard>
  </div>
)}


          {/* =========================
              ✅ PROFILE TAB
             ========================= */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Account</h2>
                <p className={cx("text-sm", MutedText)}>Manage your personal profile and identity settings.</p>
              </div>

              <SectionCard
                title="Your Account"
                subtitle="This is managed by Clerk (recommended)."
                isDarkMode={isDarkMode}
                MutedText={MutedText}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{user?.fullName || "Your name"}</div>
                    <div className={cx("text-sm mt-1", MutedText)}>{user?.primaryEmailAddress?.emailAddress || ""}</div>
                    <div className={cx("text-sm mt-1", MutedText)}>{user?.primaryPhoneNumber?.phoneNumber || ""}</div>
                  </div>

                  <div className={cx("rounded-xl border p-3", isDarkMode ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white")}>
                    <div className="text-sm font-semibold">Quick actions</div>
                    <div className={cx("text-xs mt-1", MutedText)}>Edit name, email, phone, connected accounts.</div>
                    <div className="mt-3">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Edit Profile"
                subtitle="Full Clerk profile editor (safe and complete)."
                isDarkMode={isDarkMode}
                MutedText={MutedText}
              >
                <div className={cx("rounded-2xl border overflow-hidden", isDarkMode ? "border-neutral-800 bg-neutral-950" : "border-neutral-200 bg-white")}>
                  <UserProfile
                    appearance={{
                      elements: {
                        card: { background: "transparent", boxShadow: "none" },
                      },
                    }}
                  />
                </div>
              </SectionCard>
            </div>
          )}

          {/* =========================
              ✅ BILLING TAB
             ========================= */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Billing & Subscription</h2>
                <p className={cx("text-sm", MutedText)}>Show current plan, invoices, payment method, and cancellation.</p>
              </div>

              <SectionCard title="Current Plan" subtitle="Wire this to Stripe subscription data." isDarkMode={isDarkMode} MutedText={MutedText}>
                <div className={cx("rounded-xl border p-4", isDarkMode ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white")}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">Starter</div>
                      <div className={cx("text-sm mt-1", MutedText)}>Includes receptionist + CRM basics.</div>
                    </div>
                    <div className={cx("text-xs px-3 py-1 rounded-full border", isDarkMode ? "border-neutral-700 text-neutral-300" : "border-neutral-300 text-neutral-700")}>
                      Active
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={cx("rounded-xl border p-4", isDarkMode ? "border-neutral-800" : "border-neutral-200")}>
                      <div className="text-sm font-semibold">Price</div>
                      <div className={cx("text-sm mt-1", MutedText)}>$297/mo</div>
                    </div>
                    <div className={cx("rounded-xl border p-4", isDarkMode ? "border-neutral-800" : "border-neutral-200")}>
                      <div className="text-sm font-semibold">Renewal</div>
                      <div className={cx("text-sm mt-1", MutedText)}>Feb 28, 2026</div>
                    </div>
                    <div className={cx("rounded-xl border p-4", isDarkMode ? "border-neutral-800" : "border-neutral-200")}>
                      <div className="text-sm font-semibold">Seats</div>
                      <div className={cx("text-sm mt-1", MutedText)}>1 admin</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col md:flex-row gap-3 justify-end">
                  <button type="button" className={cx("px-6 py-3 rounded-lg font-medium transition-colors", isDarkMode ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300")}>
                    Manage Payment Method
                  </button>
                  <button type="button" onClick={() => setShowCancelModal(true)} className="px-6 py-3 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors">
                    Cancel Subscription
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Invoices" subtitle="Wire this to Stripe invoices list endpoint." isDarkMode={isDarkMode} MutedText={MutedText}>
                <div className={cx("text-sm", MutedText)}>No invoices yet. (Next: show a table with invoice date, amount, and download link.)</div>
              </SectionCard>
            </div>
          )}

          {/* =========================
              ✅ NOTIFICATIONS TAB
             ========================= */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Notifications</h2>
                <p className={cx("text-sm", MutedText)}>Control alerts for appointments, missed calls, and summaries.</p>
              </div>

              <SectionCard title="Email Notifications" subtitle="Send email alerts to your account email." isDarkMode={isDarkMode} MutedText={MutedText}>
                <div className="space-y-3">
                  <Toggle
                    checked={notifs.email.appointmentBooked}
                    onChange={(v) => setNotifs((p) => ({ ...p, email: { ...p.email, appointmentBooked: v } }))}
                    label="Appointment booked"
                    hint="Email me when a new appointment is booked."
                    isDarkMode={isDarkMode}
                    MutedText={MutedText}
                  />
                  <Toggle
                    checked={notifs.email.missedCall}
                    onChange={(v) => setNotifs((p) => ({ ...p, email: { ...p.email, missedCall: v } }))}
                    label="Missed call"
                    hint="Email me when the receptionist misses a call or fails to capture info."
                    isDarkMode={isDarkMode}
                    MutedText={MutedText}
                  />
                  <Toggle
                    checked={notifs.email.dailySummary}
                    onChange={(v) => setNotifs((p) => ({ ...p, email: { ...p.email, dailySummary: v } }))}
                    label="Daily summary"
                    hint="Daily report of calls, appointments, and outcomes."
                    isDarkMode={isDarkMode}
                    MutedText={MutedText}
                  />
                </div>
              </SectionCard>

              <SectionCard title="SMS Notifications" subtitle="Send SMS alerts to your saved phone number." isDarkMode={isDarkMode} MutedText={MutedText}>
                <div className="space-y-3">
                  <Toggle
                    checked={notifs.sms.appointmentBooked}
                    onChange={(v) => setNotifs((p) => ({ ...p, sms: { ...p.sms, appointmentBooked: v } }))}
                    label="Appointment booked"
                    hint="Text me when a new appointment is booked."
                    isDarkMode={isDarkMode}
                    MutedText={MutedText}
                  />
                  <Toggle
                    checked={notifs.sms.missedCall}
                    onChange={(v) => setNotifs((p) => ({ ...p, sms: { ...p.sms, missedCall: v } }))}
                    label="Missed call"
                    hint="Text me if a call fails or no message is captured."
                    isDarkMode={isDarkMode}
                    MutedText={MutedText}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Slack" subtitle="Optional: send alerts to a Slack channel via webhook." isDarkMode={isDarkMode} MutedText={MutedText}>
                <div className="space-y-3">
                  <Toggle
                    checked={notifs.slack.enabled}
                    onChange={(v) => setNotifs((p) => ({ ...p, slack: { ...p.slack, enabled: v } }))}
                    label="Enable Slack alerts"
                    hint="When enabled, we’ll post events to your webhook."
                    isDarkMode={isDarkMode}
                    MutedText={MutedText}
                  />
                  <div>
                    <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={notifs.slack.webhookUrl}
                      onChange={(e) => setNotifs((p) => ({ ...p, slack: { ...p.slack, webhookUrl: e.target.value } }))}
                      className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="https://hooks.slack.com/services/..."
                      disabled={!notifs.slack.enabled}
                    />
                    <div className={cx("text-xs mt-2", MutedText)}>We only store this in your business settings JSON.</div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={saveNotifications}
                    disabled={savingNotifs}
                    className={cx("px-6 py-3 rounded-lg font-medium text-white transition-colors", savingNotifs ? "bg-emerald-700/60" : "bg-emerald-500 hover:bg-emerald-600")}
                  >
                    {savingNotifs ? "Saving..." : "Save Notifications"}
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {/* =========================
              ✅ SECURITY TAB
             ========================= */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Security</h2>
                <p className={cx("text-sm", MutedText)}>Password changes are handled by Clerk (secure). Other settings can be stored as JSON.</p>
              </div>

              <SectionCard title="Change Password" subtitle="This is managed by Clerk — safest option." isDarkMode={isDarkMode} MutedText={MutedText}>
                <div className={cx("rounded-xl border p-4", isDarkMode ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white")}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">Password</div>
                      <div className={cx("text-sm mt-1", MutedText)}>Update your password in your Clerk account. Your app never stores passwords.</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("profile")}
                        className={cx("px-5 py-3 rounded-lg font-medium transition-colors", isDarkMode ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300")}
                      >
                        Open Account Settings
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Security Preferences" subtitle="Store these in business/user settings JSON." isDarkMode={isDarkMode} MutedText={MutedText}>
                <div className="space-y-3">
                  <Toggle
                    checked={security.loginAlerts}
                    onChange={(v) => setSecurity((p) => ({ ...p, loginAlerts: v }))}
                    label="Login alerts"
                    hint="Notify me when a new device logs in."
                    isDarkMode={isDarkMode}
                    MutedText={MutedText}
                  />
                  <Toggle
                    checked={security.mfaEnabled}
                    onChange={(v) => setSecurity((p) => ({ ...p, mfaEnabled: v }))}
                    label="Require MFA"
                    hint="Enforce multi-factor authentication for this account."
                    isDarkMode={isDarkMode}
                    MutedText={MutedText}
                  />

                  <div className={cx("rounded-xl border p-4", isDarkMode ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white")}>
                    <div className="font-medium">Session timeout</div>
                    <div className={cx("text-sm mt-1", MutedText)}>Auto-logout after inactivity (minutes).</div>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="number"
                        min={15}
                        max={1440}
                        value={security.sessionTimeoutMins}
                        onChange={(e) => setSecurity((p) => ({ ...p, sessionTimeoutMins: Number(e.target.value || 0) }))}
                        className={cx("w-40 px-4 py-3 rounded-lg border", InputBg)}
                      />
                      <div className={cx("text-xs", MutedText)}>Min 15 • Max 1440</div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Active Sessions" subtitle="Wire this to Clerk sessions if you want." isDarkMode={isDarkMode} MutedText={MutedText}>
                <div className={cx("text-sm", MutedText)}>Coming next: show devices/sessions and allow sign-out everywhere.</div>
              </SectionCard>
            </div>
          )}

          {/* =========================
              ✅ PREFERENCES TAB
             ========================= */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Preferences</h2>
                <p className={cx("text-sm", MutedText)}>Customize how your dashboard feels. Store as JSON per business or per user.</p>
              </div>

              <SectionCard title="Locale & Formatting" subtitle="These affect calendar, dates, and display." isDarkMode={isDarkMode} MutedText={MutedText}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Timezone</label>
                    <input
                      value={prefs.timezone}
                      onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value }))}
                      className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                      placeholder="America/New_York"
                    />
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Language</label>
                    <select
                      value={prefs.language}
                      onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
                      className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>

                  <div>
                    <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Date format</label>
                    <select
                      value={prefs.dateFormat}
                      onChange={(e) => setPrefs((p) => ({ ...p, dateFormat: e.target.value }))}
                      className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div className={cx("rounded-xl border p-4", isDarkMode ? "border-neutral-800 bg-neutral-900/40" : "border-neutral-200 bg-white")}>
                    <div className="font-medium">Week starts on Monday</div>
                    <div className={cx("text-sm mt-1", MutedText)}>Calendar week layout.</div>
                    <div className="mt-3">
                      <Toggle
                        checked={prefs.weekStartsOnMonday}
                        onChange={(v) => setPrefs((p) => ({ ...p, weekStartsOnMonday: v }))}
                        label="Enabled"
                        hint="If enabled, your calendar weeks start Monday."
                        isDarkMode={isDarkMode}
                        MutedText={MutedText}
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Dashboard UI" subtitle="Optional UI preferences for power users." isDarkMode={isDarkMode} MutedText={MutedText}>
                <div className="space-y-3">
                  <Toggle
                    checked={prefs.compactMode}
                    onChange={(v) => setPrefs((p) => ({ ...p, compactMode: v }))}
                    label="Compact mode"
                    hint="Tighter spacing in tables and cards."
                    isDarkMode={isDarkMode}
                    MutedText={MutedText}
                  />
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={savePreferences}
                    disabled={savingPrefs}
                    className={cx("px-6 py-3 rounded-lg font-medium text-white transition-colors", savingPrefs ? "bg-emerald-700/60" : "bg-emerald-500 hover:bg-emerald-600")}
                  >
                    {savingPrefs ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
        <AnimatePresence>
  {serviceModalOpen && (
    <>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={() => setServiceModalOpen(false)}
      />
      <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className={cx(
            "w-full max-w-lg rounded-2xl border p-6",
            isDarkMode
              ? "bg-neutral-900 border-neutral-800"
              : "bg-white border-neutral-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-5">
            <div className="text-xl font-bold">Service</div>
            <div className={cx("text-sm mt-1", MutedText)}>
              This is what the receptionist will explain to callers.
            </div>
          </div>

          <div className="space-y-4">
            <input
              value={serviceDraft.name}
              onChange={(e) =>
                setServiceDraft((p) => ({ ...p, name: e.target.value }))
              }
              className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
              placeholder="Service name"
            />

            <textarea
              value={serviceDraft.description}
              onChange={(e) =>
                setServiceDraft((p) => ({ ...p, description: e.target.value }))
              }
              className={cx(
                "w-full px-4 py-3 rounded-lg border min-h-[110px]",
                InputBg
              )}
              placeholder="Description"
            />

            <input
              value={serviceDraft.price}
              onChange={(e) =>
                setServiceDraft((p) => ({ ...p, price: e.target.value }))
              }
              className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
              placeholder="Price (e.g. $99 or Starting at $150)"
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setServiceModalOpen(false)}
              className={cx(
                "flex-1 px-6 py-3 rounded-lg font-medium",
                isDarkMode
                  ? "bg-neutral-800 hover:bg-neutral-700"
                  : "bg-neutral-200 hover:bg-neutral-300"
              )}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setServices((prev) => {
                  const exists = prev.some((x) => x.id === serviceDraft.id);
                  if (exists)
                    return prev.map((x) =>
                      x.id === serviceDraft.id ? serviceDraft : x
                    );
                  return [serviceDraft, ...prev];
                });
                setServiceModalOpen(false);
              }}
              className="flex-1 px-6 py-3 rounded-lg font-medium text-white bg-emerald-500 hover:bg-emerald-600"
            >
              Save Service
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>


        {/* ✅ Department Modal */}
        <AnimatePresence>
          {deptModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setDeptModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 16 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div
                  className={cx("w-full max-w-lg rounded-2xl border p-6", isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-5">
                    <div className="text-xl font-bold">{editingDept ? `Edit Department: ${editingDept.name}` : "Add Department"}</div>
                    <div className={cx("text-sm mt-1", MutedText)}>This is what the receptionist will say on calls. Keep it simple and human.</div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Department name *</label>
                      <input
                        value={deptDraft.name}
                        onChange={(e) => setDeptDraft((p) => ({ ...p, name: e.target.value }))}
                        className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                        placeholder="Billing"
                      />
                    </div>

                    <div>
                      <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Description *</label>
                      <textarea
                        value={deptDraft.description}
                        onChange={(e) => setDeptDraft((p) => ({ ...p, description: e.target.value }))}
                        className={cx("w-full px-4 py-3 rounded-lg border min-h-[110px]", InputBg)}
                        placeholder="Invoices, payments, receipts, and billing questions."
                      />
                      <div className={cx("text-xs mt-2", MutedText)}>Tip: write how a receptionist would explain it in one sentence.</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Public phone (optional)</label>
                        <input
                          value={deptDraft.publicPhone || ""}
                          onChange={(e) => setDeptDraft((p) => ({ ...p, publicPhone: e.target.value }))}
                          className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                          placeholder="(optional) 718-555-1234"
                        />
                      </div>

                      <div>
                        <label className={cx("text-sm font-medium mb-2 block", isDarkMode ? "text-neutral-300" : "text-neutral-700")}>Hours note (optional)</label>
                        <input
                          value={deptDraft.hoursNote || ""}
                          onChange={(e) => setDeptDraft((p) => ({ ...p, hoursNote: e.target.value }))}
                          className={cx("w-full px-4 py-3 rounded-lg border", InputBg)}
                          placeholder='e.g., "Mon–Fri 9am–5pm"'
                        />
                      </div>
                    </div>

                    <div>
                      <Toggle
                        checked={!!deptDraft.enabled}
                        onChange={(v) => setDeptDraft((p) => ({ ...p, enabled: v }))}
                        label="Enabled"
                        hint="If disabled, receptionist won’t mention this department."
                        isDarkMode={isDarkMode}
                        MutedText={MutedText}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDeptModalOpen(false)}
                      className={cx("flex-1 px-6 py-3 rounded-lg font-medium transition-colors", isDarkMode ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300")}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveDeptDraft}
                      className={cx("flex-1 px-6 py-3 rounded-lg font-medium text-white transition-colors", "bg-emerald-500 hover:bg-emerald-600")}
                    >
                      Save Department
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Cancel Subscription Modal */}
        <AnimatePresence>
          {showCancelModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setShowCancelModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div
                  className={cx("w-full max-w-md rounded-2xl border p-6", isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
                    <h2 className="text-2xl font-bold mb-2">Cancel Subscription?</h2>
                    <p className={cx("text-sm", MutedText)}>Are you sure you want to cancel your subscription?</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className={cx("flex-1 px-6 py-3 rounded-lg font-medium transition-colors", isDarkMode ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300")}
                    >
                      Keep Subscription
                    </button>
                    <button className="flex-1 px-6 py-3 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors">
                      Yes, Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
