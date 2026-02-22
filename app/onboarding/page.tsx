"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Form = {
  name: string;
  industry: string;
  role: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  timezone: string;
  yearsInBusiness: string;
  employees: string;
  revenueRange: string;
  website: string;
};

const TZ_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
] as const;

const INDUSTRIES = [
  "Barbershop",
  "Salon",
  "Med spa",
  "Dentist",
  "Chiropractor",
  "Gym/Fitness",
  "HVAC/Plumbing/Electric",
  "Auto repair",
  "Real estate",
  "Restaurant",
  "Other",
] as const;

const ROLE_OPTIONS = [
  "Owner",
  "Manager",
  "Front desk / receptionist",
  "Marketing",
  "Other",
] as const;

const REVENUE_RANGES = [
  "< $10k / month",
  "$10k–$25k / month",
  "$25k–$50k / month",
  "$50k–$100k / month",
  "$100k+ / month",
  "Prefer not to say",
] as const;

function isValidPhone(v: string) {
  const digits = (v || "").replace(/\D/g, "");
  return digits.length >= 10;
}

function clampIntString(v: string, maxLen = 5) {
  const digits = (v || "").replace(/[^\d]/g, "").slice(0, maxLen);
  return digits;
}

const fieldClass =
  "w-full rounded-2xl border border-black/10 bg-white/80 px-5 py-4 text-base outline-none " +
  "shadow-sm backdrop-blur transition " +
  "focus:border-zinc-900/30 focus:ring-4 focus:ring-zinc-900/10 " +
  "dark:border-white/10 dark:bg-black/30 dark:text-white " +
  "dark:focus:border-white/20 dark:focus:ring-white/10";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState<Form>({
    name: "",
    industry: "Barbershop",
    role: "Owner",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "NY",
    zip: "",
    timezone: "America/New_York",
    yearsInBusiness: "",
    employees: "",
    revenueRange: "Prefer not to say",
    website: "",
  });

  const steps = useMemo(
    () => [
      {
        title: "What’s your business name?",
        subtitle: "This is what customers will hear and see in your dashboard.",
        content: (
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Business name (e.g., Fresh Fade Barbershop)"
            className={fieldClass}
            autoFocus
          />
        ),
        validate: () => (form.name.trim() ? "" : "Please enter a business name."),
      },
      {
        title: "What industry are you in?",
        subtitle: "This helps us tailor scripts, booking, and follow-ups.",
        content: (
          <select
            value={form.industry}
            onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
            className={fieldClass}
          >
            {INDUSTRIES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        ),
        validate: () => "",
      },
      {
        title: "What’s your role?",
        subtitle: "So we know who we’re talking to and how to customize setup.",
        content: (
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            className={fieldClass}
          >
            {ROLE_OPTIONS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        ),
        validate: () => "",
      },
      {
        title: "Best phone number for customers?",
        subtitle: "Used for caller ID display, missed-call alerts, and booking confirmations.",
        content: (
          <input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="(718) 555-0123"
            className={fieldClass}
          />
        ),
        validate: () =>
          isValidPhone(form.phone) ? "" : "Enter a valid phone number (10+ digits).",
      },
      {
        title: "Where is the business located?",
        subtitle: "This helps with local SEO fields, confirmations, and customer trust.",
        content: (
          <div className="space-y-3">
            <input
              value={form.address1}
              onChange={(e) => setForm((p) => ({ ...p, address1: e.target.value }))}
              placeholder="Address line 1"
              className={fieldClass}
            />
            <input
              value={form.address2}
              onChange={(e) => setForm((p) => ({ ...p, address2: e.target.value }))}
              placeholder="Address line 2 (optional)"
              className={fieldClass}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="City"
                className={fieldClass}
              />
              <input
                value={form.state}
                onChange={(e) =>
                  setForm((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))
                }
                placeholder="State"
                className={fieldClass}
              />
              <input
                value={form.zip}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    zip: e.target.value.replace(/[^\d-]/g, "").slice(0, 10),
                  }))
                }
                placeholder="ZIP"
                className={fieldClass}
              />
            </div>
          </div>
        ),
        validate: () => {
          if (!form.address1.trim() || !form.city.trim() || !form.state.trim() || !form.zip.trim()) {
            return "Please complete address, city, state, and ZIP.";
          }
          return "";
        },
      },
      {
        title: "How long have you been in business?",
        subtitle: "Helps position your brand in the AI’s messaging (new vs established).",
        content: (
          <input
            value={form.yearsInBusiness}
            onChange={(e) =>
              setForm((p) => ({ ...p, yearsInBusiness: clampIntString(e.target.value, 2) }))
            }
            placeholder="Years (e.g., 6)"
            className={fieldClass}
            inputMode="numeric"
          />
        ),
        validate: () => (form.yearsInBusiness ? "" : "Enter number of years (e.g., 1)."),
      },
      {
        title: "How many employees?",
        subtitle: "Helps tune staffing assumptions and booking flow.",
        content: (
          <input
            value={form.employees}
            onChange={(e) =>
              setForm((p) => ({ ...p, employees: clampIntString(e.target.value, 4) }))
            }
            placeholder="Employees (e.g., 8)"
            className={fieldClass}
            inputMode="numeric"
          />
        ),
        validate: () => (form.employees ? "" : "Enter employee count (can be 1)."),
      },
      {
        title: "Approx monthly revenue?",
        subtitle: "Optional, but it helps us prioritize the best automations for you.",
        content: (
          <select
            value={form.revenueRange}
            onChange={(e) => setForm((p) => ({ ...p, revenueRange: e.target.value }))}
            className={fieldClass}
          >
            {REVENUE_RANGES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        ),
        validate: () => "",
      },
      {
        title: "Timezone & website",
        subtitle: "Timezone affects booking times. Website is optional.",
        content: (
          <div className="space-y-3">
            <select
              value={form.timezone}
              onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
              className={fieldClass}
            >
              {TZ_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>

            <input
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              placeholder="Website (optional)"
              className={fieldClass}
            />
          </div>
        ),
        validate: () => "",
      },
      {
        title: "All set.",
        subtitle: "Create your dashboard and we’ll personalize your AI + CRM setup.",
        content: (
          <div className="rounded-3xl border border-black/10 bg-white/70 p-6 text-sm shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="text-base font-semibold text-zinc-900 dark:text-white">
              {form.name || "Your business"}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-zinc-700 dark:text-zinc-200">
              <div><span className="opacity-70">Industry:</span> {form.industry}</div>
              <div><span className="opacity-70">Role:</span> {form.role}</div>
              <div><span className="opacity-70">Phone:</span> {form.phone}</div>
              <div><span className="opacity-70">TZ:</span> {form.timezone}</div>
              <div className="sm:col-span-2">
                <span className="opacity-70">Address:</span>{" "}
                {[form.address1, form.address2].filter(Boolean).join(", ")},{" "}
                {form.city}, {form.state} {form.zip}
              </div>
              <div><span className="opacity-70">Years:</span> {form.yearsInBusiness}</div>
              <div><span className="opacity-70">Employees:</span> {form.employees}</div>
              <div className="sm:col-span-2">
                <span className="opacity-70">Revenue:</span> {form.revenueRange}
              </div>
              {form.website ? (
                <div className="sm:col-span-2">
                  <span className="opacity-70">Website:</span> {form.website}
                </div>
              ) : null}
            </div>
          </div>
        ),
        validate: () => "",
      },
    ],
    [form]
  );

  const total = steps.length;
  const current = steps[step];

  function next() {
    setErr("");
    const message = current.validate?.() || "";
    if (message) return setErr(message);
    setStep((s) => Math.min(total - 1, s + 1));
  }

  function back() {
    setErr("");
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    setBusy(true);
    setErr("");

    const payload = {
      name: form.name.trim(),
      timezone: form.timezone,
      industry: form.industry,
      role: form.role,
      phone: form.phone,
      address: {
        line1: form.address1,
        line2: form.address2,
        city: form.city,
        state: form.state,
        zip: form.zip,
      },
      yearsInBusiness: Number(form.yearsInBusiness || 0),
      employees: Number(form.employees || 0),
      revenueRange: form.revenueRange,
      website: form.website?.trim() || "",
    };

    const res = await fetch("/api/businesses/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setBusy(false);
      setErr(data?.error || "Failed to create business");
      return;
    }

    window.location.href = "/dashboard";
  }

  const progressPct = Math.round(((step + 1) / total) * 100);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-50 dark:bg-black">
      {/* background “pop” */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-zinc-900/10 blur-3xl dark:bg-white/10" />
        <div className="absolute -right-40 top-24 h-[520px] w-[520px] rounded-full bg-zinc-900/5 blur-3xl dark:bg-white/5" />
        <div className="absolute bottom-[-220px] left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-zinc-900/10 blur-3xl dark:bg-white/10" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-3xl">
          {/* top bar */}
          <div className="mb-6 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm backdrop-blur
                         dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
            >
              <span className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-white" />
              Onboarding
            </motion.div>

            <div className="text-xs text-zinc-600 dark:text-zinc-300">
              Step <span className="font-semibold">{step + 1}</span> of{" "}
              <span className="font-semibold">{total}</span> •{" "}
              <span className="font-semibold">{progressPct}%</span>
            </div>
          </div>

          {/* progress w/ shimmer */}
          <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <motion.div
              className="relative h-2 rounded-full bg-zinc-900 dark:bg-white"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.35 }}
            >
              <motion.div
                className="absolute inset-0 opacity-30"
                animate={{ x: ["-30%", "130%"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                }}
              />
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.99 }}
              transition={{ duration: 0.22 }}
              className="relative rounded-[28px] border border-black/10 bg-white/75 p-10 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.35)] backdrop-blur
                         dark:border-white/10 dark:bg-white/5"
            >
              {/* subtle inner glow */}
              <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-black/5 dark:ring-white/5" />

              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {current.title}
              </h1>
              <p className="mt-2 text-base text-zinc-600 dark:text-zinc-300">
                {current.subtitle}
              </p>

              <div className="mt-7">{current.content}</div>

              <AnimatePresence>
                {err ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200"
                  >
                    {err}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={back}
                  disabled={busy || step === 0}
                  className="rounded-2xl border border-black/10 bg-white/80 px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm
                             hover:bg-white disabled:opacity-60
                             dark:border-white/10 dark:bg-black/30 dark:text-white dark:hover:bg-white/10"
                >
                  Back
                </button>

                <div className="flex-1" />

                {step < total - 1 ? (
                  <motion.button
                    type="button"
                    onClick={next}
                    disabled={busy}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm
                               hover:bg-zinc-800 disabled:opacity-60
                               dark:bg-white dark:text-black dark:hover:bg-zinc-100"
                  >
                    Next
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={submit}
                    disabled={busy}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm
                               hover:bg-zinc-800 disabled:opacity-60
                               dark:bg-white dark:text-black dark:hover:bg-zinc-100"
                  >
                    {busy ? "Creating…" : "Create business"}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <p className="mt-5 text-center text-xs text-zinc-600 dark:text-zinc-400">
            We use this to personalize the AI receptionist, scripts, and booking flow. You can edit everything later.
          </p>
        </div>
      </div>
    </div>
  );
}
