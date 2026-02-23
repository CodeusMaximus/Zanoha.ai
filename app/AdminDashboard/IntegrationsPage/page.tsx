"use client";

import { useState, useEffect, useMemo } from "react";
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

export default function IntegrationsPage() {
  // ✅ FIX: not stuck in dark mode (supports .dark AND data-theme)
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const isDarkMode = theme === "dark";

  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showForwardingModal, setShowForwardingModal] = useState(false);

  // Email provider connect modal (Gmail/Outlook)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailProvider, setEmailProvider] = useState<"gmail" | "outlook">("gmail");
  const [forwardEnabled, setForwardEnabled] = useState(false);
  const [forwardNumber, setForwardNumber] = useState("");
  const [forwardSaving, setForwardSaving] = useState(false);
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");

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
    obs.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMql = () => readTheme();
    mql?.addEventListener?.("change", onMql);

    return () => {
      obs.disconnect();
      mql?.removeEventListener?.("change", onMql);
    };
  }, []);

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "twilio",
      name: "Twilio",
      description: "Voice calls, SMS, and phone number management for your AI receptionist",
      icon: "📞",
      status: "connected",
      category: "communication",
      required: true,
      settings: {
        accountSid: "AC••••••••••••••••••••••••••••••",
        authToken: "••••••••••••••••••••••••••••••••",
        phoneNumber: "+1 (555) 123-4567",
        forwardingEnabled: true,
        forwardingNumber: "+1 (555) 987-6543",
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

    // ✅ EMAIL PROVIDERS (UI only)
    {
      id: "gmail",
      name: "Gmail",
      description: "Connect Gmail to read, send, and manage inbox folders inside your CRM",
      icon: "📨",
      status: "disconnected",
      category: "communication",
      settings: null,
    },
    {
      id: "outlook",
      name: "Outlook / Microsoft 365",
      description: "Connect Outlook to sync inbox, send email, and organize folders",
      icon: "📮",
      status: "disconnected",
      category: "communication",
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

  // ✅ UI only handlers (wire later)
  function openEmailConnect(provider: "gmail" | "outlook") {
    setEmailProvider(provider);
    setShowEmailModal(true);
  }

  function setIntegrationStatus(id: string, status: IntegrationStatus) {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  }

  function handleConnectClick(integration: Integration) {
    if (integration.id === "gmail") return openEmailConnect("gmail");
    if (integration.id === "outlook") return openEmailConnect("outlook");
    setSelectedIntegration(integration);
  }
  async function openForwardingModal() {
    try {
      const r = await fetch("/api/twilio/config", { cache: "no-store" });
      const data = await r.json();
      setForwardEnabled(!!data.forwardingEnabled);
      setForwardNumber(data.forwardingNumber || "");
      setTwilioPhoneNumber(data.phoneNumber || "");
    } catch {
      // use defaults
    }
    setShowForwardingModal(true);
  }

  const ShellBg = isDarkMode ? "bg-neutral-950 text-white" : "bg-neutral-50 text-neutral-900";
  const CardBg = isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200";
  const Muted = isDarkMode ? "text-neutral-400" : "text-neutral-600";

  return (
    <div className={`min-h-screen ${ShellBg} transition-colors duration-200`}>
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Integrations</h1>
          <p className={`text-sm ${Muted}`}>
            Connect your favorite tools and services to enhance your AI receptionist
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
            <p className="text-3xl font-bold text-emerald-500">{stats.connected}</p>
          </div>
          <div className={`p-5 rounded-xl border ${CardBg}`}>
            <p className={`text-sm mb-1 ${Muted}`}>Available</p>
            <p className="text-3xl font-bold">{stats.available}</p>
          </div>
        </div>

        {/* Integration Categories */}
        {Object.entries(categories).map(([categoryKey, category]) => {
          const categoryIntegrations = integrations.filter((i) => i.category === categoryKey);
          if (categoryIntegrations.length === 0) return null;

          return (
            <div key={categoryKey} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{category.title}</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoryIntegrations.map((integration, index) => (
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
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{integration.name}</h3>
                            {integration.required && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                Required
                              </span>
                            )}
                            {(integration.id === "gmail" || integration.id === "outlook") && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
                                Inbox
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${Muted}`}>{integration.description}</p>
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
                            onClick={() => setSelectedIntegration(integration)}
                            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${isDarkMode
                              ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                              : "bg-neutral-900 hover:bg-neutral-800 text-white"
                              }`}
                          >
                            Configure
                          </button>

                          {integration.id === "twilio" && (
                            <button
                              onClick={() => setShowForwardingModal(true)}
                              className="flex-1 py-2.5 rounded-lg font-medium text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                            >
                              Setup Forwarding
                            </button>
                          )}

                          <button
                            onClick={() => setIntegrationStatus(integration.id, "disconnected")}
                            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${isDarkMode
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
                          Connect
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}

        {/* ==========================
            ✅ Email Connect Modal (UI only)
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
                  className={`w-full max-w-2xl rounded-2xl border ${isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
                    } p-6`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        {emailProvider === "gmail" ? "📨 Connect Gmail" : "📮 Connect Outlook / Microsoft 365"}
                      </h2>
                      <p className={`text-sm ${Muted}`}>
                        Wire your tenant email so the Inbox page can read, send, and organize mail.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowEmailModal(false)}
                      className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
                        } transition-colors`}
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div
                      className={`p-4 rounded-xl border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"
                        }`}
                    >
                      <div className="font-semibold mb-1">Recommended (OAuth)</div>
                      <p className={`text-sm ${Muted}`}>
                        Best UX: user clicks “Authorize”, you store refresh token encrypted per tenant, then your Inbox can
                        fetch folders + send mail.
                      </p>

                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          // UI only: later this becomes window.location.href = `/api/integrations/${provider}/start`
                          onClick={() => alert("UI only: later we’ll redirect to OAuth start endpoint")}
                          className="flex-1 py-2.5 rounded-lg font-medium text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                        >
                          Authorize {emailProvider === "gmail" ? "Gmail" : "Outlook"}
                        </button>
                        <button
                          type="button"
                          onClick={() => alert("UI only: later we’ll open scope details")}
                          className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${isDarkMode
                            ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                            : "bg-neutral-900 hover:bg-neutral-800 text-white"
                            }`}
                        >
                          View Permissions
                        </button>
                      </div>

                      <div className={`mt-3 text-xs ${Muted}`}>
                        Scopes you’ll likely need: read mail, send mail, list folders, and optionally manage labels.
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"
                        }`}
                    >
                      <div className={`text-sm ${isDarkMode ? "text-blue-200" : "text-blue-900"}`}>
                        💡 If you want “Compose” with CC/BCC + folders inside your CRM, OAuth is the way.
                        API keys/passwords shouldn’t be typed in here.
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowEmailModal(false)}
                        className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${isDarkMode ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300"
                          }`}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          // UI only: simulate connection
                          setIntegrationStatus(emailProvider === "gmail" ? "gmail" : "outlook", "connected");
                          setShowEmailModal(false);
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

        {/* Configuration Modal */}
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
                  className={`w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border ${isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
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
                      className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
                        } transition-colors`}
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedIntegration.status === "connected" ? (
                      <>
                        {selectedIntegration.id === "twilio" && (
                          <>
                            <div>
                              <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                                Account SID
                              </label>
                              <input
                                type="text"
                                value={selectedIntegration.settings?.accountSid}
                                readOnly
                                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-100 border-neutral-300"
                                  }`}
                              />
                            </div>
                            <div>
                              <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                                Auth Token
                              </label>
                              <input
                                type="password"
                                value={selectedIntegration.settings?.authToken}
                                readOnly
                                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-100 border-neutral-300"
                                  }`}
                              />
                            </div>
                          </>
                        )}

                        {selectedIntegration.id === "stripe" && (
                          <>
                            <div>
                              <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                                Public Key
                              </label>
                              <input
                                type="text"
                                value={selectedIntegration.settings?.publicKey}
                                readOnly
                                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-100 border-neutral-300"
                                  }`}
                              />
                            </div>
                          </>
                        )}

                        {selectedIntegration.id === "openai" && (
                          <>
                            <div>
                              <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                                API Key
                              </label>
                              <input
                                type="password"
                                value={selectedIntegration.settings?.apiKey}
                                readOnly
                                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-100 border-neutral-300"
                                  }`}
                              />
                            </div>
                            <div>
                              <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                                Model
                              </label>
                              <select
                                value={selectedIntegration.settings?.model}
                                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-300"
                                  }`}
                                onChange={() => { }}
                              >
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                              </select>
                            </div>
                          </>
                        )}

                        {/* ✅ Google Calendar placeholder */}
                        {selectedIntegration.id === "google-calendar" && (
                          <div className={`p-4 rounded-lg border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}>
                            <div className="font-semibold mb-1">Calendar Connected</div>
                            <div className={`text-sm ${Muted}`}>Calendar ID: {selectedIntegration.settings?.calendarId}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div
                          className={`p-4 rounded-lg border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-blue-50 border-blue-200"
                            }`}
                        >
                          <p className={`text-sm ${isDarkMode ? "text-neutral-300" : "text-blue-900"}`}>
                            UI only: later we’ll use OAuth or API credentials depending on provider.
                          </p>
                        </div>

                        <div>
                          <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                            API Key / Credentials
                          </label>
                          <input
                            type="text"
                            placeholder="Enter your API key..."
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-300"
                              }`}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setSelectedIntegration(null)}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300"
                        }`}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-2 rounded-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      onClick={() => {
                        // UI only: pretend connect/save worked
                        if (selectedIntegration.status === "disconnected") {
                          setIntegrationStatus(selectedIntegration.id, "connected");
                        }
                        setSelectedIntegration(null);
                      }}
                    >
                      {selectedIntegration.status === "connected" ? "Save Changes" : "Connect (UI)"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Phone Forwarding Modal */}
        <AnimatePresence>
          {showForwardingModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setShowForwardingModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div
                  className={`w-full max-w-2xl rounded-2xl border ${isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
                    } p-6`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">📞 Phone Number Forwarding</h2>
                      <p className={`text-sm ${Muted}`}>
                        Forward your existing business number to your Twilio AI number
                      </p>
                    </div>
                    <button
                      onClick={() => openForwardingModal()}
                      className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
                        } transition-colors`}
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div
                      className={`p-4 rounded-lg border ${isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"
                        }`}
                    >
                      <p className={`text-sm ${isDarkMode ? "text-blue-300" : "text-blue-900"}`}>
                        💡 <strong>How it works:</strong> When customers call your existing number, it forwards to your AI receptionist Twilio number.
                      </p>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">Enable Call Forwarding</div>
                          <div className={`text-xs mt-0.5 ${Muted}`}>
                            When OFF, calls go directly to your AI receptionist
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={forwardEnabled}
                            onChange={(e) => setForwardEnabled(e.target.checked)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm font-medium">{forwardEnabled ? "On" : "Off"}</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                        Your Business Number (forward FROM)
                      </label>
                      <input
                        type="tel"
                        value={forwardNumber}
                        onChange={(e) => setForwardNumber(e.target.value)}
                        placeholder="+13475551234 or (347) 555-1234"
                        disabled={!forwardEnabled}
                        className={`w-full px-3 py-3 rounded-lg border text-lg outline-none disabled:opacity-40 ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-300"
                          }`}
                      />
                    </div>

                    <div className="flex items-center justify-center py-2">
                      <svg className={`w-6 h-6 ${isDarkMode ? "text-neutral-600" : "text-neutral-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>

                    <div>
                      <label className={`text-sm font-medium mb-2 block ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                        Your Twilio AI Number (forward TO)
                      </label>
                      <input
                        type="tel"
                        value={twilioPhoneNumber}
                        readOnly
                        className={`w-full px-3 py-3 rounded-lg border text-lg ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-100 border-neutral-300"
                          }`}
                      />
                    </div>

                    <div className={`p-4 rounded-lg border ${isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-100 border-neutral-200"}`}>
                      <h3 className="font-semibold mb-3">Setup Instructions:</h3>
                      <ol className={`space-y-2 text-sm ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
                        <li className="flex gap-2"><span className="font-bold">1.</span><span>Enable call forwarding with your carrier</span></li>
                        <li className="flex gap-2"><span className="font-bold">2.</span><span>Forward to: <strong>{twilioPhoneNumber || "+1 (xxx) xxx-xxxx"}</strong></span></li>
                        <li className="flex gap-2"><span className="font-bold">3.</span><span>Test by calling your business number</span></li>
                      </ol>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${isDarkMode ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-200"
                        }`}
                    >
                      <p className={`text-sm ${isDarkMode ? "text-orange-300" : "text-orange-900"}`}>
                        ⚠️ Call forwarding may incur carrier charges.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowForwardingModal(false)}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300"
                        }`}
                    >
                      Close
                    </button>
                    <button
                      disabled={forwardSaving}
                      onClick={async () => {
                        setForwardSaving(true);
                        try {
                          const digits = forwardNumber.replace(/\D/g, "");
                          const normalized = forwardEnabled
                            ? digits.length === 10
                              ? `+1${digits}`
                              : forwardNumber
                            : "";
                          const r = await fetch("/api/twilio/forwarding/set", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              enabled: forwardEnabled,
                              forwardingNumber: normalized,
                            }),
                          });
                          const data = await r.json();
                          if (!r.ok) throw new Error(data?.error || "Save failed");
                          setShowForwardingModal(false);
                        } catch (e: any) {
                          alert(e?.message || "Save failed");
                        } finally {
                          setForwardSaving(false);
                        }
                      }}
                      className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${forwardSaving
                        ? "bg-neutral-500 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-600"
                        }`}
                    >
                      {forwardSaving ? "Saving..." : "Save"}
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
