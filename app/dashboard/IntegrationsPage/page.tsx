"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type IntegrationStatus = "connected" | "disconnected" | "error";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: IntegrationStatus;
  category: "communication" | "scheduling" | "payments" | "crm" | "analytics";
  settings?: any;
  required?: boolean;
}

type AvailNumber = {
  phoneNumber: string;
  friendlyName?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
};

type TwilioConfig = {
  connected: boolean;
  phoneNumber?: string;
  phoneNumberSid?: string;
  areaCode?: string;
  forwardingEnabled?: boolean;
  forwardingNumber?: string;
};

function normalizeToE164US(input: string) {
  const raw = (input || "").trim();
  if (!raw) return "";
  if (/^\+\d{10,15}$/.test(raw)) return raw;

  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw;
}

export default function IntegrationsPage() {
  // ✅ FIX: not stuck in dark mode (supports .dark AND data-theme)
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const isDarkMode = theme === "dark";

  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);

  // ✅ Number reservation + forwarding UI
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>({
    connected: true,
    phoneNumber: "",
    forwardingEnabled: false,
    forwardingNumber: "",
  });

  const [showNumberModal, setShowNumberModal] = useState(false);
  const [areaCode, setAreaCode] = useState("718");
  const [availableNumbers, setAvailableNumbers] = useState<AvailNumber[]>([]);
  const [numLoading, setNumLoading] = useState(false);
  const [reservingNumber, setReservingNumber] = useState<string | null>(null);

  const [forwardEnabled, setForwardEnabled] = useState(false);
  const [forwardNumber, setForwardNumber] = useState("");
  const [forwardSaving, setForwardSaving] = useState(false);

  // Email provider connect modal (Gmail/Outlook)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailProvider, setEmailProvider] = useState<"gmail" | "outlook">(
    "gmail"
  );

  // ✅ Zapier connect modal
  const [showZapierModal, setShowZapierModal] = useState(false);
  const [zapierKey, setZapierKey] = useState("");
  const [zapierBizId, setZapierBizId] = useState("");
  const [zapierLoading, setZapierLoading] = useState(false);

  const zapierWebhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/zapier/webhook`
      : "";

  // Track querystring results after OAuth redirects
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Check theme changes
  useEffect(() => {
    const root = document.documentElement;

    const readTheme = () => {
      const byClass = root.classList.contains("dark");
      const byData = root.getAttribute("data-theme") === "dark";
      setTheme(byClass || byData ? "dark" : "light");
    };

    readTheme();
    const obs = new MutationObserver(readTheme);
    obs.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMql = () => readTheme();
    mql?.addEventListener?.("change", onMql);

    return () => {
      obs.disconnect();
      mql?.removeEventListener?.("change", onMql);
    };
  }, []);

  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    setIntegrations([
      {
        id: "twilio",
        name: "AI Receptionist Number",
        description:
          "Reserve a local phone number for your AI receptionist and configure call routing.",
        icon: "📞",
        status: "connected",
        category: "communication",
        required: true,
        settings: {
          phoneNumber: "",
          forwardingEnabled: false,
          forwardingNumber: "",
        },
      },
      {
        id: "stripe",
        name: "Stripe",
        description: "Accept payments and manage subscriptions",
        icon: "💳",
        status: "connected",
        category: "payments",
        settings: {
          publicKey: "pk_live_••••••••••••••••••••",
          secretKey: "sk_live_••••••••••••••••••••",
          webhookSecret: "whsec_••••••••••••••••••",
        },
      },

      // ✅ NEW: QUICKBOOKS (UI only for now)
      {
        id: "quickbooks",
        name: "QuickBooks Online",
        description:
          "Sync customers, invoices, and payments to keep accounting up to date (OAuth).",
        icon: "🧾",
        status: "disconnected",
        category: "payments",
        settings: null,
      },

      {
        id: "google-calendar",
        name: "Google Calendar",
        description: "Sync appointments and manage scheduling",
        icon: "📅",
        status: "connected",
        category: "scheduling",
        settings: {
          calendarId: "primary",
          syncEnabled: true,
        },
      },
      {
        id: "openai",
        name: "OpenAI",
        description: "Power your AI receptionist with advanced language models",
        icon: "🤖",
        status: "connected",
        category: "communication",
        required: true,
        settings: {
          apiKey: "sk-••••••••••••••••••••••••••••••",
          model: "gpt-4",
        },
      },

      // ✅ EMAIL PROVIDERS
      {
        id: "gmail",
        name: "Gmail",
        description:
          "Connect Gmail to read, send, and manage inbox folders inside your CRM",
        icon: "📨",
        status: "disconnected",
        category: "communication",
        settings: null,
      },
      {
        id: "outlook",
        name: "Outlook / Microsoft 365",
        description:
          "Connect Outlook to sync inbox, send email, and organize folders",
        icon: "📮",
        status: "disconnected",
        category: "communication",
        settings: null,
      },

      // ✅ NEW: GOOGLE DRIVE (UI only for now)
      {
        id: "google-drive",
        name: "Google Drive",
        description:
          "Auto-save call recordings, transcripts, and exports to Drive (per-tenant OAuth).",
        icon: "🗂️",
        status: "disconnected",
        category: "analytics",
        settings: null,
      },

      // Optional: sending-only provider
      {
        id: "sendgrid",
        name: "SendGrid",
        description: "Send email notifications and confirmations (sending only)",
        icon: "📧",
        status: "disconnected",
        category: "communication",
        settings: null,
      },
      {
        id: "slack",
        name: "Slack",
        description: "Get real-time notifications in your Slack workspace",
        icon: "💬",
        status: "disconnected",
        category: "communication",
        settings: null,
      },
      {
        id: "hubspot",
        name: "HubSpot",
        description: "Sync contacts and manage customer relationships",
        icon: "🎯",
        status: "disconnected",
        category: "crm",
        settings: null,
      },
      {
        id: "salesforce",
        name: "Salesforce",
        description: "Connect to your Salesforce CRM",
        icon: "☁️",
        status: "disconnected",
        category: "crm",
        settings: null,
      },
      {
        id: "zapier",
        name: "Zapier",
        description: "Connect to 5000+ apps with custom workflows",
        icon: "⚡",
        status: "disconnected",
        category: "analytics",
        settings: null,
      },
      {
        id: "google-analytics",
        name: "Google Analytics",
        description: "Track customer interactions and call analytics",
        icon: "📊",
        status: "disconnected",
        category: "analytics",
        settings: null,
      },
    ]);
  }, []);

  const categories = useMemo(
    () => ({
      communication: { title: "Communication", color: "blue" },
      scheduling: { title: "Scheduling", color: "purple" },
      payments: { title: "Payments", color: "green" },
      crm: { title: "CRM", color: "orange" },
      analytics: { title: "Analytics", color: "pink" },
    }),
    []
  );

  const stats = useMemo(
    () => ({
      totalIntegrations: integrations.length,
      connected: integrations.filter((i) => i.status === "connected").length,
      available: integrations.filter((i) => i.status === "disconnected").length,
    }),
    [integrations]
  );

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case "connected":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "disconnected":
        return "bg-neutral-500/10 text-neutral-600 border-neutral-500/20";
      case "error":
        return "bg-red-500/10 text-red-600 border-red-500/20";
    }
  };

  // ✅ UI handlers
  function openEmailConnect(provider: "gmail" | "outlook") {
    setEmailProvider(provider);
    setShowEmailModal(true);
  }

  function setIntegrationStatus(id: string, status: IntegrationStatus) {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  }

  async function openZapierConnect() {
    setZapierLoading(true);
    setBanner(null);

    try {
      const r = await fetch("/api/zapier/key", { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to load Zapier key");

      setZapierKey(data.apiKey || "");
      setZapierBizId(data.businessId || "");
      setShowZapierModal(true);
    } catch (e: any) {
      setBanner({ type: "error", text: e?.message || "Zapier load failed" });
    } finally {
      setZapierLoading(false);
    }
  }

  function handleConnectClick(integration: Integration) {
    if (integration.id === "gmail") return openEmailConnect("gmail");
    if (integration.id === "outlook") return openEmailConnect("outlook");

    if (integration.id === "twilio") {
      setShowNumberModal(true);
      return;
    }

    if (integration.id === "zapier") {
      openZapierConnect();
      return;
    }

    // UI-only for now (QuickBooks, Google Drive, HubSpot, Salesforce, etc.)
    setSelectedIntegration(integration);
  }

  function startOAuth(provider: "gmail" | "outlook") {
    if (provider === "gmail") {
      window.location.href =
        "/api/google/oauth/start?purpose=gmail&next=/dashboard/IntegrationsPage";
      return;
    }
    alert(
      "Outlook OAuth endpoint not wired yet. We'll add /api/integrations/microsoft/outlook/start next."
    );
  }

  async function refreshTwilioConfig() {
    try {
      const r = await fetch("/api/twilio/config", { cache: "no-store" });
      if (!r.ok) return;
      const data = (await r.json()) as TwilioConfig;
      setTwilioConfig(data);

      if (data.areaCode) setAreaCode(data.areaCode);
      setForwardEnabled(!!data.forwardingEnabled);
      setForwardNumber(data.forwardingNumber || "");

      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === "twilio"
            ? {
                ...i,
                status: data.connected ? "connected" : "disconnected",
                settings: {
                  phoneNumber: data.phoneNumber || "",
                  forwardingEnabled: !!data.forwardingEnabled,
                  forwardingNumber: data.forwardingNumber || "",
                },
              }
            : i
        )
      );
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);

    const gmailParam = sp.get("gmail");
    const connectedParam = sp.get("connected");
    const error = sp.get("error");

    if (error) {
      setBanner({ type: "error", text: `Connection error: ${error}` });
    } else if (
      gmailParam === "connected" ||
      gmailParam === "1" ||
      connectedParam === "gmail"
    ) {
      setBanner({ type: "success", text: "Gmail connected successfully." });
      setIntegrationStatus("gmail", "connected");
    }

    // Optional: if you later redirect with ?connected=quickbooks or ?connected=google-drive
    if (connectedParam === "quickbooks") {
      setBanner({ type: "success", text: "QuickBooks connected (UI)." });
      setIntegrationStatus("quickbooks", "connected");
    }
    if (connectedParam === "google-drive") {
      setBanner({ type: "success", text: "Google Drive connected (UI)." });
      setIntegrationStatus("google-drive", "connected");
    }

    if (gmailParam || connectedParam || error) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    (async () => {
      try {
        const r = await fetch("/api/integrations/google/gmail/status", {
          cache: "no-store",
        });
        if (!r.ok) return;
        const data = await r.json();
        setIntegrationStatus(
          "gmail",
          data.connected ? "connected" : "disconnected"
        );
      } catch {
        // ignore
      }
    })();

    refreshTwilioConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchAvailableNumbers() {
    setBanner(null);
    setNumLoading(true);
    setAvailableNumbers([]);

    try {
      const r = await fetch("/api/twilio/numbers/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaCode, limit: 12 }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to search numbers");

      setAvailableNumbers(Array.isArray(data.numbers) ? data.numbers : []);
      if ((data.numbers || []).length === 0) {
        setBanner({
          type: "error",
          text: "No numbers available for that area code. Try a nearby area code.",
        });
      }
    } catch (e: any) {
      setBanner({ type: "error", text: e?.message || "Search failed" });
    } finally {
      setNumLoading(false);
    }
  }

  async function reserveNumber(phoneNumber: string) {
    setReservingNumber(phoneNumber);
    setBanner(null);

    try {
      const r = await fetch("/api/twilio/numbers/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, areaCode }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to reserve number");

      setBanner({
        type: "success",
        text: `Number reserved: ${data.phoneNumber || phoneNumber}`,
      });

      setTwilioConfig((prev) => ({
        ...prev,
        phoneNumber: data.phoneNumber || phoneNumber,
        phoneNumberSid: data.phoneNumberSid,
        areaCode,
        connected: true,
      }));

      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === "twilio"
            ? {
                ...i,
                status: "connected",
                settings: {
                  ...(i.settings || {}),
                  phoneNumber: data.phoneNumber || phoneNumber,
                  forwardingEnabled: forwardEnabled,
                  forwardingNumber: forwardNumber,
                },
              }
            : i
        )
      );

      setAvailableNumbers([]);
    } catch (e: any) {
      setBanner({ type: "error", text: e?.message || "Reserve failed" });
    } finally {
      setReservingNumber(null);
    }
  }

  async function saveForwarding() {
    setForwardSaving(true);
    setBanner(null);

    const normalized = forwardEnabled ? normalizeToE164US(forwardNumber) : "";

    try {
      const r = await fetch("/api/twilio/forwarding/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: forwardEnabled,
          forwardingNumber: normalized,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to save forwarding");

      if (forwardEnabled) setForwardNumber(normalized);

      setBanner({
        type: "success",
        text: forwardEnabled ? "Forwarding saved." : "Forwarding disabled.",
      });

      setTwilioConfig((prev) => ({
        ...prev,
        forwardingEnabled: forwardEnabled,
        forwardingNumber: forwardEnabled ? normalized : "",
      }));

      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === "twilio"
            ? {
                ...i,
                settings: {
                  ...(i.settings || {}),
                  phoneNumber: twilioConfig.phoneNumber || "",
                  forwardingEnabled: forwardEnabled,
                  forwardingNumber: forwardEnabled ? normalized : "",
                },
              }
            : i
        )
      );
    } catch (e: any) {
      setBanner({ type: "error", text: e?.message || "Save failed" });
    } finally {
      setForwardSaving(false);
    }
  }

  const ShellBg = isDarkMode
    ? "bg-neutral-950 text-white"
    : "bg-neutral-50 text-neutral-900";
  const CardBg = isDarkMode
    ? "bg-neutral-900 border-neutral-800"
    : "bg-white border-neutral-200";
  const Muted = isDarkMode ? "text-neutral-400" : "text-neutral-600";

  const canSearchArea = /^\d{3}$/.test(areaCode);

  return (
    <div className={`min-h-screen ${ShellBg} transition-colors duration-200`}>
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Banner */}
        <AnimatePresence>
          {banner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                banner.type === "success"
                  ? isDarkMode
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : isDarkMode
                  ? "border-red-500/20 bg-red-500/10 text-red-200"
                  : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>{banner.text}</div>
                <button
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                    isDarkMode
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-black/5 hover:bg-black/10"
                  }`}
                  onClick={() => setBanner(null)}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Integrations
          </h1>
          <p className={`text-sm ${Muted}`}>
            Connect your favorite tools and services to enhance your AI
            receptionist
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-5 rounded-xl border ${CardBg}`}>
            <p className={`text-sm mb-1 ${Muted}`}>Total Integrations</p>
            <p className="text-3xl font-bold">{stats.totalIntegrations}</p>
          </div>
          <div className={`p-5 rounded-xl border ${CardBg}`}>
            <p className={`text-sm mb-1 ${Muted}`}>Connected</p>
            <p className="text-3xl font-bold text-emerald-500">
              {stats.connected}
            </p>
          </div>
          <div className={`p-5 rounded-xl border ${CardBg}`}>
            <p className={`text-sm mb-1 ${Muted}`}>Available</p>
            <p className="text-3xl font-bold">{stats.available}</p>
          </div>
        </div>

        {/* Integration Categories */}
        {Object.entries(categories).map(([categoryKey, category]) => {
          const categoryIntegrations = integrations.filter(
            (i) => i.category === categoryKey
          );
          if (categoryIntegrations.length === 0) return null;

          return (
            <div key={categoryKey} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{category.title}</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoryIntegrations.map((integration, index) => {
                  const isTwilio = integration.id === "twilio";
                  const isZapier = integration.id === "zapier";
                  const isQuickbooks = integration.id === "quickbooks";
                  const isDrive = integration.id === "google-drive";

                  const twilioNumber =
                    integration.settings?.phoneNumber ||
                    twilioConfig.phoneNumber ||
                    "";

                  return (
                    <motion.div
                      key={integration.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-6 rounded-xl border ${CardBg}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <span className="text-4xl">{integration.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-lg">
                                {integration.name}
                              </h3>

                              {integration.required && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                  Required
                                </span>
                              )}

                              {(integration.id === "gmail" ||
                                integration.id === "outlook") && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
                                  Inbox
                                </span>
                              )}

                              {isTwilio && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                  Number
                                </span>
                              )}

                              {isZapier && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                  Webhooks
                                </span>
                              )}

                              {isQuickbooks && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                  Accounting
                                </span>
                              )}

                              {isDrive && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20">
                                  Files
                                </span>
                              )}
                            </div>

                            <p className={`text-sm ${Muted}`}>
                              {integration.description}
                            </p>

                            {isTwilio && (
                              <div className={`mt-3 text-sm ${Muted}`}>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white/90">
                                    Current:
                                  </span>
                                  <span
                                    className={
                                      isDarkMode
                                        ? "text-neutral-200"
                                        : "text-neutral-900"
                                    }
                                  >
                                    {twilioNumber
                                      ? twilioNumber
                                      : "No number reserved yet"}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs">
                                  Forwarding:{" "}
                                  <span
                                    className={
                                      isDarkMode
                                        ? "text-neutral-200"
                                        : "text-neutral-900"
                                    }
                                  >
                                    {twilioConfig.forwardingEnabled
                                      ? twilioConfig.forwardingNumber ||
                                        "Enabled"
                                      : "Off"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                            integration.status
                          )}`}
                        >
                          {integration.status}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {integration.status === "connected" ? (
                          <>
                            <button
                              onClick={() =>
                                isTwilio
                                  ? setShowNumberModal(true)
                                  : isZapier
                                  ? openZapierConnect()
                                  : setSelectedIntegration(integration)
                              }
                              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                                isDarkMode
                                  ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                                  : "bg-neutral-900 hover:bg-neutral-800 text-white"
                              }`}
                            >
                              {isTwilio
                                ? "Manage Number"
                                : isZapier
                                ? "Manage Zapier"
                                : "Configure"}
                            </button>

                            {isTwilio && (
                              <button
                                onClick={() => setShowNumberModal(true)}
                                className="flex-1 py-2.5 rounded-lg font-medium text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                              >
                                Reserve / Search
                              </button>
                            )}

                            <button
                              onClick={() =>
                                setIntegrationStatus(
                                  integration.id,
                                  "disconnected"
                                )
                              }
                              className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                                isDarkMode
                                  ? "border border-red-500/20 text-red-400 hover:bg-red-500/10"
                                  : "border border-red-500 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleConnectClick(integration)}
                            className="w-full py-2.5 rounded-lg font-medium text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                          >
                            {integration.id === "twilio"
                              ? "Reserve Number"
                              : zapierLoading && integration.id === "zapier"
                              ? "Loading..."
                              : "Connect"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ==========================
            ✅ Zapier Modal
           ========================== */}
        <AnimatePresence>
          {showZapierModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setShowZapierModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 18 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div
                  className={`w-full max-w-2xl rounded-2xl border ${
                    isDarkMode
                      ? "bg-neutral-900 border-neutral-800"
                      : "bg-white border-neutral-200"
                  } p-6`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        ⚡ Connect Zapier
                      </h2>
                      <p className={`text-sm ${Muted}`}>
                        Use this webhook + headers inside{" "}
                        <span className="font-semibold">Webhooks by Zapier</span>
                        .
                      </p>
                    </div>
                    <button
                      onClick={() => setShowZapierModal(false)}
                      className={`p-2 rounded-lg ${
                        isDarkMode
                          ? "hover:bg-neutral-800"
                          : "hover:bg-neutral-100"
                      } transition-colors`}
                      aria-label="Close"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-xl border ${
                        isDarkMode
                          ? "bg-neutral-800 border-neutral-700"
                          : "bg-neutral-50 border-neutral-200"
                      }`}
                    >
                      <div className="text-sm font-semibold mb-2">
                        Webhook URL
                      </div>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={zapierWebhookUrl}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                            isDarkMode
                              ? "bg-neutral-900 border-neutral-700"
                              : "bg-white border-neutral-300"
                          }`}
                        />
                        <button
                          className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                            isDarkMode
                              ? "bg-white/5 hover:bg-white/10"
                              : "bg-black/5 hover:bg-black/10"
                          }`}
                          onClick={() =>
                            navigator.clipboard.writeText(zapierWebhookUrl)
                          }
                        >
                          Copy
                        </button>
                      </div>
                      <div className={`mt-3 text-xs ${Muted}`}>
                        Zapier → Webhooks by Zapier →{" "}
                        <span className="font-semibold">POST</span> → paste URL.
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${
                        isDarkMode
                          ? "bg-neutral-800 border-neutral-700"
                          : "bg-neutral-50 border-neutral-200"
                      }`}
                    >
                      <div className="text-sm font-semibold mb-2">
                        Headers (required)
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex gap-2">
                          <input
                            readOnly
                            value={`x-business-id: ${zapierBizId}`}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                              isDarkMode
                                ? "bg-neutral-900 border-neutral-700"
                                : "bg-white border-neutral-300"
                            }`}
                          />
                          <button
                            className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                              isDarkMode
                                ? "bg-white/5 hover:bg-white/10"
                                : "bg-black/5 hover:bg-black/10"
                            }`}
                            onClick={() =>
                              navigator.clipboard.writeText(zapierBizId)
                            }
                          >
                            Copy ID
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input
                            readOnly
                            value={`x-zapier-key: ${zapierKey}`}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                              isDarkMode
                                ? "bg-neutral-900 border-neutral-700"
                                : "bg-white border-neutral-300"
                            }`}
                          />
                          <button
                            className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                              isDarkMode
                                ? "bg-white/5 hover:bg-white/10"
                                : "bg-black/5 hover:bg-black/10"
                            }`}
                            onClick={() => navigator.clipboard.writeText(zapierKey)}
                          >
                            Copy Key
                          </button>
                        </div>
                      </div>

                      <div className={`mt-3 text-xs ${Muted}`}>
                        Zapier step → <span className="font-semibold">Headers</span>{" "}
                        section → add these exactly.
                      </div>

                      <button
                        className="mt-3 w-full py-2.5 rounded-lg font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                        onClick={async () => {
                          setZapierLoading(true);
                          setBanner(null);
                          try {
                            const r = await fetch("/api/zapier/key", {
                              method: "POST",
                            });
                            const data = await r.json();
                            if (!r.ok)
                              throw new Error(data?.error || "Rotate failed");
                            setZapierKey(data.apiKey || "");
                            setZapierBizId(data.businessId || zapierBizId);
                            setBanner({
                              type: "success",
                              text: "Zapier key rotated.",
                            });
                          } catch (e: any) {
                            setBanner({
                              type: "error",
                              text: e?.message || "Rotate failed",
                            });
                          } finally {
                            setZapierLoading(false);
                          }
                        }}
                        disabled={zapierLoading}
                      >
                        {zapierLoading ? "Rotating..." : "Rotate Key"}
                      </button>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${
                        isDarkMode
                          ? "bg-neutral-800 border-neutral-700"
                          : "bg-neutral-50 border-neutral-200"
                      }`}
                    >
                      <div className="text-sm font-semibold mb-2">
                        Example Body
                      </div>
                      <pre
                        className={`text-xs overflow-auto rounded-lg p-3 border ${
                          isDarkMode
                            ? "bg-neutral-900 border-neutral-700"
                            : "bg-white border-neutral-200"
                        }`}
                      >{`{
  "event": "lead.create",
  "name": "Jane Doe",
  "email": "jane@demo.com",
  "phone": "+17185551212",
  "source": "zapier"
}`}</pre>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowZapierModal(false)}
                        className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                          isDarkMode
                            ? "bg-neutral-800 hover:bg-neutral-700"
                            : "bg-neutral-200 hover:bg-neutral-300"
                        }`}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setIntegrationStatus("zapier", "connected");
                          setShowZapierModal(false);
                          setBanner({
                            type: "success",
                            text: "Zapier connected.",
                          });
                        }}
                        className="px-6 py-2.5 rounded-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      >
                        Mark Connected
                      </button>
                    </div>

                    <div className={`text-xs ${Muted}`}>
                      Tip: Create a Zap → Trigger: any app → Action: Webhooks by
                      Zapier (POST) → paste URL → add headers → send JSON body.
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ==========================
            ✅ Number Reservation Modal
           ========================== */}
        <AnimatePresence>
          {showNumberModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setShowNumberModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 18 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div
                  className={`w-full max-w-4xl rounded-2xl border ${
                    isDarkMode
                      ? "bg-neutral-900 border-neutral-800"
                      : "bg-white border-neutral-200"
                  } p-6 pointer-events-auto max-h-[90vh] overflow-hidden`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        📞 Reserve Your AI Receptionist Number
                      </h2>
                      <p className={`text-sm ${Muted}`}>
                        Choose an area code, reserve a number, and optionally
                        enable forwarding.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNumberModal(false)}
                      className={`p-2 rounded-lg ${
                        isDarkMode
                          ? "hover:bg-neutral-800"
                          : "hover:bg-neutral-100"
                      } transition-colors`}
                      aria-label="Close"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* ✅ Scrollable modal body */}
                  <div className="mt-1 overflow-auto max-h-[calc(90vh-140px)] pr-1">
                    {/* Current */}
                    <div
                      className={`mb-5 p-4 rounded-xl border ${
                        isDarkMode
                          ? "bg-neutral-800 border-neutral-700"
                          : "bg-neutral-50 border-neutral-200"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="text-sm">
                          <div className="font-semibold">
                            Current Number:{" "}
                            <span
                              className={
                                isDarkMode
                                  ? "text-neutral-200"
                                  : "text-neutral-900"
                              }
                            >
                              {twilioConfig.phoneNumber
                                ? twilioConfig.phoneNumber
                                : "Not reserved yet"}
                            </span>
                          </div>
                          <div className={`text-xs mt-1 ${Muted}`}>
                            Tip: picking a local area code improves answer rate
                            for outbound calls.
                          </div>
                        </div>

                        <button
                          onClick={refreshTwilioConfig}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDarkMode
                              ? "bg-white/5 hover:bg-white/10"
                              : "bg-black/5 hover:bg-black/10"
                          }`}
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
                      <div
                        className={`p-4 rounded-xl border ${
                          isDarkMode
                            ? "bg-neutral-950/40 border-neutral-800"
                            : "bg-white border-neutral-200"
                        }`}
                      >
                        <label
                          className={`text-sm font-medium block ${
                            isDarkMode ? "text-neutral-300" : "text-neutral-700"
                          }`}
                        >
                          Area Code
                        </label>
                        <input
                          value={areaCode}
                          onChange={(e) =>
                            setAreaCode(
                              e.target.value.replace(/\D/g, "").slice(0, 3)
                            )
                          }
                          placeholder="718"
                          className={`mt-2 w-full px-3 py-3 rounded-lg border text-lg outline-none ${
                            isDarkMode
                              ? "bg-neutral-800 border-neutral-700 focus:border-neutral-600"
                              : "bg-white border-neutral-300 focus:border-neutral-400"
                          }`}
                        />

                        <button
                          disabled={!canSearchArea || numLoading}
                          onClick={searchAvailableNumbers}
                          className={`mt-3 w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                            !canSearchArea || numLoading
                              ? isDarkMode
                                ? "bg-neutral-800 text-neutral-500"
                                : "bg-neutral-200 text-neutral-500"
                              : "bg-blue-500 hover:bg-blue-600 text-white"
                          }`}
                        >
                          {numLoading ? "Searching..." : "Search Numbers"}
                        </button>

                        {/* Forwarding */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold">
                                Call Forwarding
                              </div>
                              <div className={`text-xs ${Muted}`}>
                                Optional. Forward calls to your phone/front
                                desk.
                              </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={forwardEnabled}
                                onChange={(e) =>
                                  setForwardEnabled(e.target.checked)
                                }
                                className="h-4 w-4"
                              />
                              Enable
                            </label>
                          </div>

                          <input
                            type="tel"
                            value={forwardNumber}
                            onChange={(e) => setForwardNumber(e.target.value)}
                            placeholder="+13475551234 or (347) 555-1234"
                            disabled={!forwardEnabled}
                            className={`mt-3 w-full px-3 py-3 rounded-lg border text-base outline-none disabled:opacity-40 ${
                              isDarkMode
                                ? "bg-neutral-800 border-neutral-700 focus:border-neutral-600"
                                : "bg-white border-neutral-300 focus:border-neutral-400"
                            }`}
                          />

                          <button
                            onClick={saveForwarding}
                            disabled={forwardSaving}
                            className={`mt-2 w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                              forwardSaving
                                ? isDarkMode
                                  ? "bg-neutral-800 text-neutral-500"
                                  : "bg-neutral-200 text-neutral-500"
                                : "bg-emerald-500 hover:bg-emerald-600 text-white"
                            }`}
                          >
                            {forwardSaving ? "Saving..." : "Save Forwarding"}
                          </button>

                          <div className={`mt-2 text-xs ${Muted}`}>
                            We’ll normalize your number to E.164 (example:
                            +17185551212).
                          </div>
                        </div>
                      </div>

                      {/* Results */}
                      <div
                        className={`p-4 rounded-xl border ${
                          isDarkMode
                            ? "bg-neutral-950/40 border-neutral-800"
                            : "bg-white border-neutral-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-sm font-semibold">
                              Available Numbers
                            </div>
                            <div className={`text-xs ${Muted}`}>
                              Choose one to reserve for your tenant.
                            </div>
                          </div>
                          <div className={`text-xs ${Muted}`}>
                            {availableNumbers.length
                              ? `${availableNumbers.length} found`
                              : ""}
                          </div>
                        </div>

                        {availableNumbers.length === 0 ? (
                          <div
                            className={`p-4 rounded-lg border ${
                              isDarkMode
                                ? "bg-neutral-900 border-neutral-800"
                                : "bg-neutral-50 border-neutral-200"
                            }`}
                          >
                            <div className="text-sm font-medium">
                              Search results will appear here.
                            </div>
                            <div className={`text-xs mt-1 ${Muted}`}>
                              Try 718, 347, 917, 212, 646, 929, etc.
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 max-h-[420px] overflow-auto pr-1 space-y-2">
                            {availableNumbers.map((n) => (
                              <div
                                key={n.phoneNumber}
                                className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                                  isDarkMode
                                    ? "bg-neutral-900 border-neutral-800"
                                    : "bg-white border-neutral-200"
                                }`}
                              >
                                <div>
                                  <div className="font-semibold">
                                    {n.phoneNumber}
                                  </div>
                                  <div className={`text-xs ${Muted}`}>
                                    {n.locality ? `${n.locality}, ` : ""}
                                    {n.region || ""}
                                    {n.postalCode ? ` • ${n.postalCode}` : ""}
                                  </div>
                                </div>

                                <button
                                  onClick={() => reserveNumber(n.phoneNumber)}
                                  disabled={reservingNumber !== null}
                                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                    reservingNumber !== null
                                      ? isDarkMode
                                        ? "bg-neutral-800 text-neutral-500"
                                        : "bg-neutral-200 text-neutral-500"
                                      : "bg-white text-black hover:opacity-90"
                                  }`}
                                >
                                  {reservingNumber === n.phoneNumber
                                    ? "Reserving..."
                                    : "Reserve"}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setShowNumberModal(false)}
                        className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                          isDarkMode
                            ? "bg-neutral-800 hover:bg-neutral-700"
                            : "bg-neutral-200 hover:bg-neutral-300"
                        }`}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => setShowNumberModal(false)}
                        className="px-6 py-2.5 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ==========================
            ✅ Email Connect Modal (unchanged)
           ========================== */}
        <AnimatePresence>
          {showEmailModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setShowEmailModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 18 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div
                  className={`w-full max-w-2xl rounded-2xl border ${
                    isDarkMode
                      ? "bg-neutral-900 border-neutral-800"
                      : "bg-white border-neutral-200"
                  } p-6`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        {emailProvider === "gmail"
                          ? "📨 Connect Gmail"
                          : "📮 Connect Outlook / Microsoft 365"}
                      </h2>
                      <p className={`text-sm ${Muted}`}>
                        Wire your tenant email so the Inbox page can read, send,
                        and organize mail.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowEmailModal(false)}
                      className={`p-2 rounded-lg ${
                        isDarkMode
                          ? "hover:bg-neutral-800"
                          : "hover:bg-neutral-100"
                      } transition-colors`}
                      aria-label="Close"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div
                      className={`p-4 rounded-xl border ${
                        isDarkMode
                          ? "bg-neutral-800 border-neutral-700"
                          : "bg-neutral-50 border-neutral-200"
                      }`}
                    >
                      <div className="font-semibold mb-1">Recommended (OAuth)</div>
                      <p className={`text-sm ${Muted}`}>
                        Click “Authorize” to grant inbox access. We’ll store a
                        refresh token per tenant so you can fetch messages + send
                        mail.
                      </p>

                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => startOAuth(emailProvider)}
                          className="flex-1 py-2.5 rounded-lg font-medium text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                        >
                          Authorize{" "}
                          {emailProvider === "gmail" ? "Gmail" : "Outlook"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              emailProvider === "gmail"
                                ? "Gmail scopes: gmail.readonly + gmail.send (optional gmail.modify later)"
                                : "Outlook scopes will be Microsoft Graph Mail.Read/Mail.Send (we'll add next)"
                            )
                          }
                          className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                            isDarkMode
                              ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                              : "bg-neutral-900 hover:bg-neutral-800 text-white"
                          }`}
                        >
                          View Permissions
                        </button>
                      </div>

                      <div className={`mt-3 text-xs ${Muted}`}>
                        {emailProvider === "gmail"
                          ? "We’ll request: read mail + send mail. (Labels/folders later if you want.)"
                          : "We’ll request Graph permissions once we wire Microsoft OAuth endpoints."}
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${
                        isDarkMode
                          ? "bg-blue-500/10 border-blue-500/20"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div
                        className={`text-sm ${
                          isDarkMode ? "text-blue-200" : "text-blue-900"
                        }`}
                      >
                        💡 If you want “Compose” + folders inside your CRM, OAuth is
                        the way. Don’t ask tenants for passwords.
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowEmailModal(false)}
                        className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                          isDarkMode
                            ? "bg-neutral-800 hover:bg-neutral-700"
                            : "bg-neutral-200 hover:bg-neutral-300"
                        }`}
                      >
                        Close
                      </button>

                      <button
                        onClick={() => {
                          setIntegrationStatus(
                            emailProvider === "gmail" ? "gmail" : "outlook",
                            "connected"
                          );
                          setShowEmailModal(false);
                          setBanner({
                            type: "success",
                            text: `${
                              emailProvider === "gmail" ? "Gmail" : "Outlook"
                            } marked connected (UI).`,
                          });
                        }}
                        className="px-6 py-2.5 rounded-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      >
                        Mark Connected (UI)
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Configuration Modal (unchanged + small UI-only hints for QuickBooks/Drive) */}
        <AnimatePresence>
          {selectedIntegration && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setSelectedIntegration(null)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div
                  className={`w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border ${
                    isDarkMode
                      ? "bg-neutral-900 border-neutral-800"
                      : "bg-white border-neutral-200"
                  } p-6`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        <span className="text-3xl">{selectedIntegration.icon}</span>
                        {selectedIntegration.name} Settings
                      </h2>
                      <p className={`text-sm ${Muted}`}>
                        {selectedIntegration.status === "connected"
                          ? "Manage your integration settings"
                          : "Connect your account to get started"}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedIntegration(null)}
                      className={`p-2 rounded-lg ${
                        isDarkMode
                          ? "hover:bg-neutral-800"
                          : "hover:bg-neutral-100"
                      } transition-colors`}
                      aria-label="Close"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedIntegration.status === "connected" ? (
                      <>
                        {selectedIntegration.id === "stripe" && (
                          <div>
                            <label
                              className={`text-sm font-medium mb-2 block ${
                                isDarkMode
                                  ? "text-neutral-300"
                                  : "text-neutral-700"
                              }`}
                            >
                              Public Key
                            </label>
                            <input
                              type="text"
                              value={selectedIntegration.settings?.publicKey}
                              readOnly
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDarkMode
                                  ? "bg-neutral-800 border-neutral-700"
                                  : "bg-neutral-100 border-neutral-300"
                              }`}
                            />
                          </div>
                        )}

                        {selectedIntegration.id === "openai" && (
                          <>
                            <div>
                              <label
                                className={`text-sm font-medium mb-2 block ${
                                  isDarkMode
                                    ? "text-neutral-300"
                                    : "text-neutral-700"
                                }`}
                              >
                                API Key
                              </label>
                              <input
                                type="password"
                                value={selectedIntegration.settings?.apiKey}
                                readOnly
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  isDarkMode
                                    ? "bg-neutral-800 border-neutral-700"
                                    : "bg-neutral-100 border-neutral-300"
                                }`}
                              />
                            </div>
                            <div>
                              <label
                                className={`text-sm font-medium mb-2 block ${
                                  isDarkMode
                                    ? "text-neutral-300"
                                    : "text-neutral-700"
                                }`}
                              >
                                Model
                              </label>
                              <select
                                value={selectedIntegration.settings?.model}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                  isDarkMode
                                    ? "bg-neutral-800 border-neutral-700"
                                    : "bg-white border-neutral-300"
                                }`}
                                onChange={() => {}}
                              >
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-3.5-turbo">
                                  GPT-3.5 Turbo
                                </option>
                              </select>
                            </div>
                          </>
                        )}

                        {selectedIntegration.id === "google-calendar" && (
                          <div
                            className={`p-4 rounded-lg border ${
                              isDarkMode
                                ? "bg-neutral-800 border-neutral-700"
                                : "bg-neutral-50 border-neutral-200"
                            }`}
                          >
                            <div className="font-semibold mb-1">
                              Calendar Connected
                            </div>
                            <div className={`text-sm ${Muted}`}>
                              Calendar ID:{" "}
                              {selectedIntegration.settings?.calendarId}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div
                          className={`p-4 rounded-lg border ${
                            isDarkMode
                              ? "bg-neutral-800 border-neutral-700"
                              : "bg-blue-50 border-blue-200"
                          }`}
                        >
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-neutral-300" : "text-blue-900"
                            }`}
                          >
                            UI only: later we’ll use OAuth or API credentials
                            depending on provider.
                          </p>
                          {(selectedIntegration.id === "quickbooks" ||
                            selectedIntegration.id === "google-drive") && (
                            <p className={`text-xs mt-2 ${Muted}`}>
                              Plan: per-tenant OAuth → store refresh token → sync.
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            className={`text-sm font-medium mb-2 block ${
                              isDarkMode ? "text-neutral-300" : "text-neutral-700"
                            }`}
                          >
                            API Key / Credentials
                          </label>
                          <input
                            type="text"
                            placeholder="Enter your API key..."
                            className={`w-full px-3 py-2 rounded-lg border ${
                              isDarkMode
                                ? "bg-neutral-800 border-neutral-700"
                                : "bg-white border-neutral-300"
                            }`}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setSelectedIntegration(null)}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        isDarkMode
                          ? "bg-neutral-800 hover:bg-neutral-700"
                          : "bg-neutral-200 hover:bg-neutral-300"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-2 rounded-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      onClick={() => {
                        if (selectedIntegration.status === "disconnected") {
                          setIntegrationStatus(selectedIntegration.id, "connected");
                        }
                        setSelectedIntegration(null);
                      }}
                    >
                      {selectedIntegration.status === "connected"
                        ? "Save Changes"
                        : "Connect (UI)"}
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
