"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SettingsTab =
  | "business"
  | "profile"
  | "billing"
  | "notifications"
  | "security"
  | "preferences";

export default function SettingsPage() {
  // ✅ Detect theme correctly (doesn't get stuck on dark)
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const isDarkMode = theme === "dark";

  const [activeTab, setActiveTab] = useState<SettingsTab>("business");
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ✅ Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // ✅ Fetch existing tenant branding
  useEffect(() => {
    fetch("/api/tenant/branding")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setLogoUrl(d.branding?.logoUrl || null);
      })
      .catch(() => {});
  }, []);

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/tenant/logo", { method: "POST", body: fd });

      // ✅ avoids "Unexpected end of JSON input"
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok || !data?.ok) throw new Error(data?.error || "Upload failed");
      setLogoUrl(data.logoUrl);
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

      // ✅ avoids "Unexpected end of JSON input"
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok || !data?.ok) throw new Error(data?.error || "Remove failed");
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
      const dataTheme = root.getAttribute("data-theme"); // some setups
      const isDarkByData = dataTheme === "dark";
      setTheme(isDarkByClass || isDarkByData ? "dark" : "light");
    };

    readTheme();

    const obs = new MutationObserver(readTheme);
    obs.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });

    // also catch system toggles if you ever set theme=system elsewhere
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
        { id: "notifications", label: "Notifications", icon: "🔔" },
        { id: "security", label: "Security", icon: "🔒" },
        { id: "preferences", label: "Preferences", icon: "⚙️" },
      ] as const,
    []
  );

  const [businessHours, setBusinessHours] = useState([
    { day: "Monday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Tuesday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Wednesday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Thursday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Friday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Saturday", enabled: false, open: "09:00", close: "17:00" },
    { day: "Sunday", enabled: false, open: "09:00", close: "17:00" },
  ]);

  const ShellBg = isDarkMode ? "bg-neutral-950 text-white" : "bg-neutral-50 text-neutral-900";
  const CardBg = isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200";
  const MutedText = isDarkMode ? "text-neutral-400" : "text-neutral-600";
  const InputBg = isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-300";

  return (
    <div className={`min-h-screen ${ShellBg} transition-colors duration-200`}>
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Settings</h1>
          <p className={`text-sm ${MutedText}`}>
            Manage your business, account, billing, and preferences
          </p>
        </div>

        {/* Horizontal Tabs */}
        <div className={`mb-6 p-2 rounded-xl border overflow-x-auto ${CardBg}`}>
          <nav className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? isDarkMode
                      ? "bg-white text-neutral-900"
                      : "bg-neutral-900 text-white"
                    : isDarkMode
                    ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className={`p-8 rounded-xl border ${CardBg}`}>
          {/* =========================
              ✅ BUSINESS TAB
             ========================= */}
          {activeTab === "business" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-1">Business Information</h2>
                <p className={`text-sm ${MutedText}`}>
                  Manage your business details, location, and operating hours
                </p>
              </div>

              {/* ✅ Branding / Tenant Logo */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Branding</h3>

                <div
                  className={`rounded-2xl border overflow-hidden ${
                    isDarkMode
                      ? "bg-neutral-800 border-neutral-700"
                      : "bg-neutral-50 border-neutral-200"
                  }`}
                >
                  {/* Big preview row */}
                  <div className="p-5">
                    <div
                      className={`relative w-full rounded-2xl overflow-hidden ring-1 ${
                        isDarkMode ? "bg-neutral-900 ring-white/10" : "bg-white ring-black/10"
                      }`}
                    >
                      <div className="h-[200px] md:h-[240px] w-full">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoUrl}
                            alt="Tenant logo"
                            className="h-full w-full object-contain p-6"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <div className={`text-sm font-semibold ${isDarkMode ? "text-white/60" : "text-neutral-700"}`}>
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
                      <div className={`text-sm ${MutedText}`}>
                        This replaces the sidebar header line (no more “Matte black…”).
                      </div>
                      <div className="text-xs mt-1 text-neutral-500">
                        PNG/JPG/WEBP/SVG • max 2MB • best: transparent PNG or SVG
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div
                    className={`px-5 py-4 border-t flex flex-col md:flex-row md:items-center gap-3 ${
                      isDarkMode ? "border-neutral-700" : "border-neutral-200"
                    }`}
                  >
                    <div className="flex gap-2">
                      <label
                        className={`px-4 py-2.5 rounded-lg font-medium cursor-pointer transition-colors ${
                          isDarkMode
                            ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                            : "bg-neutral-900 hover:bg-neutral-800 text-white"
                        } ${logoUploading ? "opacity-60 pointer-events-none" : ""}`}
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
                        className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                          !logoUrl || logoUploading
                            ? isDarkMode
                              ? "bg-neutral-700 text-neutral-400"
                              : "bg-neutral-200 text-neutral-500"
                            : isDarkMode
                            ? "border border-red-500/20 text-red-300 hover:bg-red-500/10"
                            : "border border-red-500/30 text-red-600 hover:bg-red-50"
                        }`}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex-1" />
                    <div className={`text-xs ${MutedText}`}>
                      Tip: square logos look best in the sidebar.
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                      Business Name *
                    </label>
                    <input
                      type="text"
                      defaultValue="Acme Inc."
                      className={`w-full px-4 py-3 rounded-lg border ${InputBg}`}
                    />
                  </div>

                  <div>
                    <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                      Legal Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Acme Incorporated"
                      className={`w-full px-4 py-3 rounded-lg border ${InputBg}`}
                    />
                  </div>

                  <div>
                    <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                      Business Type
                    </label>
                    <select
                      defaultValue="salon"
                      className={`w-full px-4 py-3 rounded-lg border ${InputBg}`}
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
                    <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                      Tax ID / EIN
                    </label>
                    <input
                      type="text"
                      placeholder="XX-XXXXXXX"
                      className={`w-full px-4 py-3 rounded-lg border ${InputBg}`}
                    />
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
                <div
                  className={`rounded-lg border overflow-hidden ${
                    isDarkMode ? "border-neutral-800" : "border-neutral-200"
                  }`}
                >
                  <table className="w-full">
                    <thead className={isDarkMode ? "bg-neutral-800" : "bg-neutral-50"}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                          Day
                        </th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                          Status
                        </th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                          Opening Time
                        </th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                          Closing Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? "divide-neutral-800" : "divide-neutral-200"}`}>
                      {businessHours.map((day, index) => (
                        <tr key={day.day}>
                          <td className="px-4 py-3 font-medium">{day.day}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setBusinessHours((prev) => {
                                  const next = [...prev];
                                  next[index] = { ...next[index], enabled: !next[index].enabled };
                                  return next;
                                });
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                day.enabled
                                  ? "bg-emerald-500"
                                  : isDarkMode
                                  ? "bg-neutral-700"
                                  : "bg-neutral-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  day.enabled ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
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
                              className={`px-3 py-2 rounded-lg border text-sm ${
                                !day.enabled
                                  ? isDarkMode
                                    ? "bg-neutral-800/50 border-neutral-800 text-neutral-600"
                                    : "bg-neutral-100 border-neutral-200 text-neutral-400"
                                  : isDarkMode
                                  ? "bg-neutral-800 border-neutral-700"
                                  : "bg-white border-neutral-300"
                              }`}
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
                              className={`px-3 py-2 rounded-lg border text-sm ${
                                !day.enabled
                                  ? isDarkMode
                                    ? "bg-neutral-800/50 border-neutral-800 text-neutral-600"
                                    : "bg-neutral-100 border-neutral-200 text-neutral-400"
                                  : isDarkMode
                                  ? "bg-neutral-800 border-neutral-700"
                                  : "bg-white border-neutral-300"
                              }`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? "bg-neutral-800 hover:bg-neutral-700"
                      : "bg-neutral-200 hover:bg-neutral-300"
                  }`}
                >
                  Reset Changes
                </button>
                <button className="px-6 py-3 rounded-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                  Save Business Information
                </button>
              </div>
            </div>
          )}

          {/* Other tabs (placeholders for now) */}
          {activeTab !== "business" && (
            <div className="space-y-2">
              <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
              <p className={`text-sm ${MutedText}`}>This section is coming next.</p>
            </div>
          )}
        </div>

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
                  className={`w-full max-w-md rounded-2xl border ${
                    isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
                  } p-6`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 text-2xl">
                      ⚠️
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Cancel Subscription?</h2>
                    <p className={`text-sm ${MutedText}`}>
                      Are you sure you want to cancel your subscription?
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                        isDarkMode ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300"
                      }`}
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
