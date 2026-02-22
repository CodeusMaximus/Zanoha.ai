"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  PhoneForwarded,
  Mic,
  Building2,
  Sparkles,
  Play,
  Wand2,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

type Settings = {
  voiceGender: "female" | "male";
  voiceId: string;
  systemPrompt: string;
  businessContext: {
    businessName: string;
    shortDescription?: string;
    services?: string[];
    hours?: string;
    address?: string;
    bookingUrl?: string;
    policies?: string;
    extraNotes?: string;
  };
  callHandling: {
    mode: "ai" | "forward_if_needed" | "always_forward";
    forwardToPhone?: string;
    ringSeconds?: number;
    fallbackToAI?: boolean;
  };
};

const DEFAULTS: Settings = {
  voiceGender: "female",
  voiceId: "nova",
  systemPrompt: "",
  businessContext: {
    businessName: "",
    shortDescription: "",
    services: [],
    hours: "",
    address: "",
    bookingUrl: "",
    policies: "",
    extraNotes: "",
  },
  callHandling: {
    mode: "forward_if_needed",
    forwardToPhone: "",
    ringSeconds: 20,
    fallbackToAI: true,
  },
};

const VOICES = {
  female: ["nova", "alloy"],
  male: ["verse"],
} as const;

const PROMPT_TEMPLATES = [
  {
    id: "friendly-sales",
    label: "Friendly + Sales-focused",
    text: `You are a helpful, friendly AI receptionist. Your goal is to convert callers into booked appointments.
Rules:
- Always ask for the caller's name and best callback number early.
- If they ask pricing, give a range and offer to book a time.
- Keep responses short and confident. Avoid long explanations.
- If you're unsure, ask one clarifying question and move toward booking.`,
  },
  {
    id: "strict-policy",
    label: "Policy-first + Clear boundaries",
    text: `You are a professional AI receptionist. Prioritize accuracy and policies.
Rules:
- Confirm the service type and preferred time before offering options.
- If asked about exceptions, reference policies and offer alternatives.
- Do not invent details. If unknown, say you'll confirm and take a message.`,
  },
  {
    id: "after-hours",
    label: "After-hours message taker",
    text: `You are an AI receptionist answering after hours.
Rules:
- Explain we're currently closed.
- Collect: name, phone, reason for calling, and preferred callback time.
- Offer the booking link if available.
- End by confirming details and thanking them.`,
  },
] as const;

function buildTrainingPrompt(settings: Settings) {
  const bc = settings.businessContext;
  const lines: string[] = [];

  lines.push(`Business name: ${bc.businessName || "(not set)"}`);
  if (bc.shortDescription) lines.push(`Description: ${bc.shortDescription}`);
  if (bc.services?.length) lines.push(`Services: ${bc.services.join(", ")}`);
  if (bc.hours) lines.push(`Hours: ${bc.hours}`);
  if (bc.address) lines.push(`Address: ${bc.address}`);
  if (bc.bookingUrl) lines.push(`Booking URL: ${bc.bookingUrl}`);
  if (bc.policies) lines.push(`Policies: ${bc.policies}`);
  if (bc.extraNotes) lines.push(`Extra notes: ${bc.extraNotes}`);

  const businessBlock = lines.join("\n");

  const behavior = settings.systemPrompt?.trim()
    ? settings.systemPrompt.trim()
    : "(no extra tenant instructions)";

  return `SYSTEM / TRAINING CONTEXT
========================
${businessBlock}

BEHAVIOR INSTRUCTIONS
=====================
${behavior}
`;
}

export default function MyReceptionistPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"voice" | "business" | "prompt" | "forwarding">(
    "voice"
  );

  const [testText, setTestText] = useState(
    "Hi! Thanks for calling. How can I help you today?"
  );
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [demoBusy, setDemoBusy] = useState(false);

  // ✅ new: Training prompt builder box
  const [showTrainer, setShowTrainer] = useState(true);
  const [trainerMode, setTrainerMode] = useState<"auto" | "manual">("auto");
  const [trainerText, setTrainerText] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const availableVoices = useMemo(
    () => VOICES[settings.voiceGender],
    [settings.voiceGender]
  );

  const autoTrainingPrompt = useMemo(
    () => buildTrainingPrompt(settings),
    [settings]
  );

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/receptionist/settings");
        const d = await r.json();
        if (d?.settings) setSettings(d.settings);
      } catch { }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    // if gender changes and current voice not in list, snap to first
    if (!(availableVoices as readonly string[]).includes(settings.voiceId)) {
      setSettings((s) => ({ ...s, voiceId: availableVoices[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.voiceGender]);

  useEffect(() => {
    // initialize trainer text on first load
    setTrainerText((prev) => prev || autoTrainingPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Keep trainer up to date when in auto mode
  useEffect(() => {
    if (trainerMode === "auto") setTrainerText(autoTrainingPrompt);
  }, [autoTrainingPrompt, trainerMode]);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch("/api/receptionist/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!r.ok) throw new Error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function testVoice() {
    setAudioUrl("");
    const r = await fetch("/api/receptionist/test-voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voiceId: settings.voiceId,
        text: testText,
      }),
    });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
  }

  // ✅ Demo = plays the current voice reading a realistic receptionist line (uses same endpoint)
  async function playDemo() {
    try {
      setDemoBusy(true);
      setAudioUrl("");
      const demo = `Thanks for calling ${settings.businessContext.businessName || "our business"
        }. This is the AI receptionist. I can help you book an appointment, answer quick questions, or take a message. What can I do for you today?`;

      const r = await fetch("/api/receptionist/test-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: settings.voiceId,
          text: demo,
        }),
      });

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } finally {
      setDemoBusy(false);
    }
  }

  function applyTemplate(id: (typeof PROMPT_TEMPLATES)[number]["id"]) {
    const t = PROMPT_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setSettings((s) => ({
      ...s,
      systemPrompt: (s.systemPrompt?.trim()
        ? `${s.systemPrompt.trim()}\n\n`
        : "") + t.text,
    }));
  }

  async function copyTrainer() {
    try {
      await navigator.clipboard.writeText(trainerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { }
  }

  if (loading) return <div className="p-6 text-zinc-300">Loading…</div>;

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">My Receptionist</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure voice, business knowledge, prompting, and call forwarding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={playDemo}
            disabled={demoBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 ring-1 ring-emerald-500/20 hover:bg-emerald-500/15 disabled:opacity-60"
          >
            <Play size={16} />
            {demoBusy ? "Generating demo…" : "Play demo"}
          </button>

          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* ✅ Big Training Box */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 ring-1 ring-white/10 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
          <div className="flex items-center gap-2">
            <Wand2 size={16} className="text-zinc-200" />
            <div>
              <div className="text-sm font-semibold text-white">
                AI Receptionist Training Prompt
              </div>
              <div className="text-xs text-zinc-400">
                This is the combined training context your AI uses (business info + behavior).
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-white/5 ring-1 ring-white/10 p-1">
              {(["auto", "manual"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setTrainerMode(v)}
                  className={[
                    "px-3 py-1.5 rounded-lg text-sm transition",
                    trainerMode === v
                      ? "bg-white/10 text-white"
                      : "text-zinc-300 hover:bg-white/5",
                  ].join(" ")}
                >
                  {v === "auto" ? "Auto-build" : "Manual edit"}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTrainer((s) => !s)}
              className="rounded-xl bg-white/5 px-3 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              {showTrainer ? "Hide" : "Show"}
            </button>

            <button
              onClick={() => setTrainerText(autoTrainingPrompt)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
              title="Rebuild from current settings"
            >
              <RefreshCw size={16} />
              Rebuild
            </button>

            <button
              onClick={copyTrainer}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showTrainer && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="px-4 pb-4"
            >
              <textarea
                value={trainerText}
                onChange={(e) => setTrainerText(e.target.value)}
                readOnly={trainerMode === "auto"}
                rows={14}
                className={[
                  "w-full rounded-2xl bg-[#0a0e14] px-4 py-3 text-sm text-white ring-1",
                  trainerMode === "auto"
                    ? "ring-white/10 opacity-95"
                    : "ring-emerald-500/25",
                ].join(" ")}
              />
              <div className="mt-2 text-xs text-zinc-400">
                {trainerMode === "auto"
                  ? "Auto-build mode: edit Business Info + Prompt & Behavior tabs and this updates automatically."
                  : "Manual mode: edit freely (you can paste this into your AI prompt system)."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <TabButton
          active={tab === "voice"}
          onClick={() => setTab("voice")}
          icon={<Mic size={16} />}
          label="Voice"
        />
        <TabButton
          active={tab === "business"}
          onClick={() => setTab("business")}
          icon={<Building2 size={16} />}
          label="Business Info"
        />
        <TabButton
          active={tab === "prompt"}
          onClick={() => setTab("prompt")}
          icon={<Sparkles size={16} />}
          label="Prompt & Behavior"
        />
        <TabButton
          active={tab === "forwarding"}
          onClick={() => setTab("forwarding")}
          icon={<PhoneForwarded size={16} />}
          label="Call Forwarding"
        />
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/10"
      >
        {tab === "voice" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Label>Voice gender</Label>
                <Toggle
                  value={settings.voiceGender}
                  onChange={(v) => setSettings((s) => ({ ...s, voiceGender: v }))}
                />
              </div>

              <button
                onClick={playDemo}
                disabled={demoBusy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 ring-1 ring-emerald-500/20 hover:bg-emerald-500/15 disabled:opacity-60"
              >
                <Play size={16} />
                {demoBusy ? "Generating…" : "Play demo"}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Voice</Label>
                <select
                  value={settings.voiceId}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, voiceId: e.target.value }))
                  }
                  className="mt-2 w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
                >
                  {availableVoices.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Test phrase</Label>
                <input
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="mt-2 w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                onClick={testVoice}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white ring-1 ring-white/15 hover:bg-white/15"
              >
                Preview voice
              </button>

              {audioUrl && (
                <div className="w-full sm:w-auto">
                  <audio controls src={audioUrl} className="h-10 w-full" />
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "business" && (
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Business name">
              <input
                value={settings.businessContext.businessName}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    businessContext: {
                      ...s.businessContext,
                      businessName: e.target.value,
                    },
                  }))
                }
                className="w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
              />
            </Field>

            <Field label="Booking URL (optional)">
              <input
                value={settings.businessContext.bookingUrl || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    businessContext: {
                      ...s.businessContext,
                      bookingUrl: e.target.value,
                    },
                  }))
                }
                className="w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
              />
            </Field>

            <Field label="Short description">
              <textarea
                value={settings.businessContext.shortDescription || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    businessContext: {
                      ...s.businessContext,
                      shortDescription: e.target.value,
                    },
                  }))
                }
                rows={4}
                className="w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
              />
            </Field>

            <Field label="Hours / Address / Policies">
              <textarea
                value={settings.businessContext.extraNotes || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    businessContext: {
                      ...s.businessContext,
                      extraNotes: e.target.value,
                    },
                  }))
                }
                rows={4}
                placeholder={`Examples:
Hours: Mon-Fri 9am-6pm, Sat 10am-4pm
Address: 123 Main St, Staten Island, NY
Policies: 24h cancellation, $20 no-show fee`}
                className="w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Services (comma separated)">
                <input
                  value={(settings.businessContext.services || []).join(", ")}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      businessContext: {
                        ...s.businessContext,
                        services: e.target.value
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean),
                      },
                    }))
                  }
                  placeholder="Haircut, Beard trim, Line up…"
                  className="w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Extra notes (everything else)">
                <textarea
                  value={settings.businessContext.policies || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      businessContext: {
                        ...s.businessContext,
                        policies: e.target.value,
                      },
                    }))
                  }
                  rows={6}
                  placeholder="Anything else the receptionist should know…"
                  className="w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
                />
              </Field>
            </div>
          </div>
        )}

        {tab === "prompt" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-zinc-300">
                Fine-tune tone, priorities, and edge-case handling.
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {PROMPT_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
                    title="Append template to your tenant instructions"
                  >
                    <Sparkles size={14} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Tenant instructions">
              <textarea
                value={settings.systemPrompt}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, systemPrompt: e.target.value }))
                }
                rows={14}
                placeholder={`Examples:
- Always ask for name + phone number before ending the call.
- If caller asks for pricing, give ranges and offer a booking.
- If it’s after hours, take a message and say we’ll call back next business day.
- If caller is angry, de-escalate and offer to forward to a manager.`}
                className="w-full rounded-2xl bg-[#0a0e14] px-4 py-3 text-sm text-white ring-1 ring-white/10"
              />
            </Field>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Call mode">
                <select
                  value={settings.callHandling.mode}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      callHandling: {
                        ...s.callHandling,
                        mode: e.target.value as any,
                      },
                    }))
                  }
                  className="w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
                >
                  <option value="ai">AI answers always</option>
                  <option value="forward_if_needed">AI first, forward if needed</option>
                  <option value="always_forward">Always forward first</option>
                </select>
              </Field>

              <Field label="Ring seconds">
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={settings.callHandling.ringSeconds ?? 20}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      callHandling: {
                        ...s.callHandling,
                        ringSeconds: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
                />
              </Field>

              <Field label="Fallback to AI">
                <select
                  value={settings.callHandling.fallbackToAI ? "yes" : "no"}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      callHandling: {
                        ...s.callHandling,
                        fallbackToAI: e.target.value === "yes",
                      },
                    }))
                  }
                  className="w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {tab === "forwarding" && (
          <div className="space-y-4">
            <div className="text-sm text-zinc-300">
              Forward calls from your <b>Twilio number</b> to your real phone.
              Your “phone → Twilio” forwarding is done via carrier settings.
            </div>

            <Field label="Forward calls to (E.164 format)">
              <input
                value={settings.callHandling.forwardToPhone || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    callHandling: {
                      ...s.callHandling,
                      forwardToPhone: e.target.value,
                    },
                  }))
                }
                placeholder="+17185551234"
                className="w-full rounded-xl bg-[#0a0e14] px-3 py-2 text-sm text-white ring-1 ring-white/10"
              />
            </Field>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
              <div className="font-medium text-white mb-1">
                Phone → Twilio forwarding
              </div>
              <div>
                To forward your personal/business phone to Twilio, enable call
                forwarding with your carrier and set it to your Twilio number.
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm ring-1 transition",
        active
          ? "bg-white/10 text-white ring-white/20"
          : "bg-transparent text-zinc-300 ring-white/10 hover:bg-white/5",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-white">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium text-white">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: "female" | "male";
  onChange: (v: "female" | "male") => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-white/5 ring-1 ring-white/10 p-1">
      {(["female", "male"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={[
            "px-3 py-1.5 rounded-lg text-sm transition",
            value === v
              ? "bg-white/10 text-white"
              : "text-zinc-300 hover:bg-white/5",
          ].join(" ")}
        >
          {v === "female" ? "Female" : "Male"}
        </button>
      ))}
    </div>
  );
}
