"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DarkModeButton from "./DarkModeToggler";

type MembershipStatus = "active" | "paused" | "past_due" | "canceled" | "expired";
type MembershipCadence = "monthly" | "quarterly" | "yearly" | "custom";

type Membership = {
  planName: string;
  status: MembershipStatus;
  cadence: MembershipCadence;
  price: string; // UI string for now (ex: "79", "199.00")
  currency: string; // "USD"
  startDate: string; // yyyy-mm-dd
  renewalDate: string; // yyyy-mm-dd
  autoRenew: boolean;

  // universal entitlements
  entitlements: {
    visitsPerPeriod?: string; // gym/yoga
    creditsPerPeriod?: string; // class packs
    hoursPerPeriod?: string; // service retainers
    discountPercent?: string; // dental membership discount
  };

  // gym/yoga-ish
  freezeAllowed?: boolean;
  freezeDaysPerYear?: string;

  // notes
  notes?: string;
};

type PatientInfo = {
  dob?: string; // yyyy-mm-dd
  gender?: "" | "female" | "male" | "nonbinary" | "prefer_not_to_say";
  preferredProvider?: string;
  allergies?: string;
  conditions?: string;
  medications?: string;
  lastVisit?: string; // yyyy-mm-dd
  nextRecallDue?: string; // yyyy-mm-dd (dental recall)
};

type InsuranceInfo = {
  provider?: string;
  memberId?: string;
  groupId?: string;
  planName?: string;
  phone?: string;
};

type EmergencyContact = {
  name?: string;
  phone?: string;
  relation?: string;
};

type Preferences = {
  preferredContactMethod: "call" | "sms" | "email";
  preferredTimeWindow?: string; // free text: "Mornings", "After 5pm"
  language?: string;
  doNotContact: boolean;
  smsOptIn: boolean;
  emailOptIn: boolean;
  marketingOptIn: boolean;
};

type HouseholdMember = {
  name: string;
  relation?: string;
  dob?: string;
};

type CustomFieldType = "text" | "number" | "date" | "select" | "multi_select" | "boolean";

type CustomField = {
  key: string; // stable key
  label: string;
  type: CustomFieldType;
  value: string; // keep as string in UI for now
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

/** light US-ish phone normalization; keep flexible for now */
function normalizePhone(input: string) {
  const raw = (input || "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  const digits = onlyDigits(raw);
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function plusMonthsISO(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const defaultMembership = (): Membership => ({
  planName: "",
  status: "active",
  cadence: "monthly",
  price: "",
  currency: "USD",
  startDate: todayISO(),
  renewalDate: plusMonthsISO(1),
  autoRenew: true,
  entitlements: {
    visitsPerPeriod: "",
    creditsPerPeriod: "",
    hoursPerPeriod: "",
    discountPercent: "",
  },
  freezeAllowed: false,
  freezeDaysPerYear: "",
  notes: "",
});

export default function AddCustomerModal({
  businessId,
  onClose,
}: {
  businessId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ===== Core required fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // ===== Contact/address + basic CRM fields
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [isReturning, setIsReturning] = useState(false);

  // ===== Lifecycle (universal)
  const [lifecycleStage, setLifecycleStage] = useState<
    "lead" | "prospect" | "active_customer" | "at_risk" | "churned" | "win_back"
  >("active_customer");

  // ===== Preferences/consent
  const [prefs, setPrefs] = useState<Preferences>({
    preferredContactMethod: "sms",
    preferredTimeWindow: "",
    language: "",
    doNotContact: false,
    smsOptIn: true,
    emailOptIn: true,
    marketingOptIn: false,
  });

  // ===== Memberships/plans (universal)
  const [membershipsEnabled, setMembershipsEnabled] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([defaultMembership()]);

  // ===== Dental/medical-ish (optional)
  const [patientEnabled, setPatientEnabled] = useState(false);
  const [patient, setPatient] = useState<PatientInfo>({
    dob: "",
    gender: "",
    preferredProvider: "",
    allergies: "",
    conditions: "",
    medications: "",
    lastVisit: "",
    nextRecallDue: "",
  });

  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insurance, setInsurance] = useState<InsuranceInfo>({
    provider: "",
    memberId: "",
    groupId: "",
    planName: "",
    phone: "",
  });

  // ===== Emergency + household
  const [emergencyEnabled, setEmergencyEnabled] = useState(false);
  const [emergency, setEmergency] = useState<EmergencyContact>({
    name: "",
    phone: "",
    relation: "",
  });

  const [householdEnabled, setHouseholdEnabled] = useState(false);
  const [household, setHousehold] = useState<HouseholdMember[]>([]);

  // ===== Custom fields (UI-only stub)
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([
    { key: "customer_id_external", label: "External Customer ID", type: "text", value: "" },
  ]);

  // ===== Accordion state
  type SectionKey =
    | "core"
    | "contact"
    | "membership"
    | "patient"
    | "emergency"
    | "preferences"
    | "custom";

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    core: true,
    contact: true,
    membership: false,
    patient: false,
    emergency: false,
    preferences: true,
    custom: false,
  });

  const DarkCard =
    "rounded-2xl border border-black/10 bg-white ring-1 ring-black/5 dark:border-white/10 dark:bg-[#0f1420] dark:ring-white/10";
  const Label = "block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5";
  const Input =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none ring-1 ring-black/5 focus:ring-black/10 dark:border-white/10 dark:bg-black/30 dark:text-white dark:ring-white/10 dark:focus:ring-white/20";
  const Textarea =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none ring-1 ring-black/5 focus:ring-black/10 dark:border-white/10 dark:bg-black/30 dark:text-white dark:ring-white/10 dark:focus:ring-white/20";

  const TagHint = useMemo(
    () =>
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tags]
  );

  function toggleSection(k: SectionKey) {
    setOpen((p) => ({ ...p, [k]: !p[k] }));
  }

  function Section({
    k,
    title,
    subtitle,
    right,
    children,
  }: {
    k: SectionKey;
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    children: React.ReactNode;
  }) {
    const isOpen = open[k];
    return (
      <div className={cx("rounded-2xl border border-black/10 dark:border-white/10", "overflow-hidden")}>
        <button
          type="button"
          onClick={() => toggleSection(k)}
          className={cx(
            "w-full flex items-start justify-between gap-4 px-5 py-4 text-left",
            "bg-zinc-50/60 hover:bg-zinc-50 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{isOpen ? "—" : "+"}</span>
            </div>
            {subtitle ? (
              <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</div>
            ) : null}
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {right}
            <span
              className={cx(
                "text-xs px-2 py-1 rounded-full border",
                isOpen
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                  : "border-black/10 bg-white text-zinc-700 dark:bg-white/10 dark:text-zinc-200 dark:border-white/10"
              )}
            >
              {isOpen ? "Open" : "Closed"}
            </span>
          </div>
        </button>

        {isOpen && <div className="px-5 py-5 bg-white dark:bg-[#0f1420]">{children}</div>}
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Name is required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        businessId,

        // core
        name: name.trim(),
        phone: normalizePhone(phone),
        email: email.trim(),
        lifecycleStage,

        // address / basic
        company: company.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip: zip.trim() || undefined,

        notes: notes.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        isReturning,

        // preferences/consent
        preferences: prefs,

        // optional modules
        memberships: membershipsEnabled
          ? memberships.map((m) => ({
              ...m,
              price: (m.price || "").trim(),
              currency: (m.currency || "USD").trim(),
              planName: (m.planName || "").trim(),
              notes: (m.notes || "").trim() || undefined,
              entitlements: {
                visitsPerPeriod: (m.entitlements.visitsPerPeriod || "").trim() || undefined,
                creditsPerPeriod: (m.entitlements.creditsPerPeriod || "").trim() || undefined,
                hoursPerPeriod: (m.entitlements.hoursPerPeriod || "").trim() || undefined,
                discountPercent: (m.entitlements.discountPercent || "").trim() || undefined,
              },
              freezeDaysPerYear: (m.freezeDaysPerYear || "").trim() || undefined,
            }))
          : undefined,

        patient: patientEnabled
          ? {
              ...patient,
              preferredProvider: patient.preferredProvider?.trim() || undefined,
              allergies: patient.allergies?.trim() || undefined,
              conditions: patient.conditions?.trim() || undefined,
              medications: patient.medications?.trim() || undefined,
            }
          : undefined,

        insurance: insuranceEnabled
          ? {
              ...insurance,
              phone: normalizePhone(insurance.phone || ""),
              provider: insurance.provider?.trim() || undefined,
              memberId: insurance.memberId?.trim() || undefined,
              groupId: insurance.groupId?.trim() || undefined,
              planName: insurance.planName?.trim() || undefined,
            }
          : undefined,

        emergencyContact: emergencyEnabled
          ? {
              ...emergency,
              phone: normalizePhone(emergency.phone || ""),
              name: emergency.name?.trim() || undefined,
              relation: emergency.relation?.trim() || undefined,
            }
          : undefined,

        householdMembers: householdEnabled
          ? household
              .map((h) => ({
                name: (h.name || "").trim(),
                relation: h.relation?.trim() || undefined,
                dob: h.dob || undefined,
              }))
              .filter((h) => h.name)
          : undefined,

        customFields: customEnabled
          ? customFields
              .map((f) => ({
                key: (f.key || "").trim(),
                label: (f.label || "").trim(),
                type: f.type,
                value: (f.value || "").trim(),
              }))
              .filter((f) => f.key && f.label)
          : undefined,
      };

      const res = await fetch("/api/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        router.refresh();
        onClose();
      } else {
        alert(data.error || "Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Failed to create customer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
  className={cx(
    "w-[min(96vw,1400px)] max-w-none max-h-[90vh] overflow-y-auto",
    DarkCard
  )}
> 

        <div className="sticky top-0 z-10 border-b border-black/10 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#0f1420]">
        <DarkModeButton />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Add New Customer</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Universal customer profile (dental, gym, yoga, B2B, anything). Expand sections as needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ===== CORE */}
          <Section
            k="core"
            title="Required Information"
            subtitle="The minimum data needed to create a customer."
            right={
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:text-blue-200">
                Core
              </span>
            }
          >
            <div className="space-y-4">
              <div>
                <label className={Label}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className={Input}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={Label}>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={Input}
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    We’ll store it normalized (ex: +17185551212) when you wire Mongo.
                  </p>
                </div>

                <div>
                  <label className={Label}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className={Input}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className={Label}>Lifecycle Stage</label>
                  <select
                    value={lifecycleStage}
                    onChange={(e) => setLifecycleStage(e.target.value as any)}
                    className={Input}
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospect</option>
                    <option value="active_customer">Active Customer</option>
                    <option value="at_risk">At Risk</option>
                    <option value="win_back">Win Back</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-7 sm:mt-0">
                  <input
                    type="checkbox"
                    id="isReturning"
                    checked={isReturning}
                    onChange={(e) => setIsReturning(e.target.checked)}
                    className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                  />
                  <label htmlFor="isReturning" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Returning
                  </label>
                </div>
              </div>
            </div>
          </Section>

          {/* ===== CONTACT / ADDRESS */}
          <Section
            k="contact"
            title="Contact & Address"
            subtitle="Optional business/contact details."
            right={
              <span className="text-xs px-2 py-1 rounded-full bg-zinc-500/10 text-zinc-700 border border-black/10 dark:text-zinc-200 dark:border-white/10">
                Optional
              </span>
            }
          >
            <div className="space-y-4">
              <div>
                <label className={Label}>Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className={Input}
                />
              </div>

              <div>
                <label className={Label}>Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  className={Input}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={Label}>City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                    className={Input}
                  />
                </div>

                <div>
                  <label className={Label}>State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="NY"
                    className={Input}
                  />
                </div>

                <div>
                  <label className={Label}>ZIP Code</label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="10001"
                    className={Input}
                  />
                </div>
              </div>

              <div>
                <label className={Label}>Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="VIP, Membership, High-LTV (comma separated)"
                  className={Input}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {TagHint.slice(0, 10).map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-1 rounded-full border border-black/10 bg-black/5 text-zinc-800 dark:border-white/10 dark:bg-white/10 dark:text-zinc-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className={Label}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything important about this customer..."
                  rows={3}
                  className={Textarea}
                />
              </div>
            </div>
          </Section>

          {/* ===== PREFERENCES / CONSENT */}
          <Section
            k="preferences"
            title="Preferences & Consent"
            subtitle="Universal settings for calls, SMS, email, and compliance."
            right={
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-200">
                Recommended
              </span>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={Label}>Preferred Contact</label>
                  <select
                    value={prefs.preferredContactMethod}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, preferredContactMethod: e.target.value as any }))
                    }
                    className={Input}
                  >
                    <option value="call">Call</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={Label}>Preferred Time Window</label>
                  <input
                    type="text"
                    value={prefs.preferredTimeWindow || ""}
                    onChange={(e) => setPrefs((p) => ({ ...p, preferredTimeWindow: e.target.value }))}
                    placeholder="Mornings, After 5pm, Weekends, etc."
                    className={Input}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className={Label}>Language</label>
                  <input
                    type="text"
                    value={prefs.language || ""}
                    onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
                    placeholder="English, Spanish, etc."
                    className={Input}
                  />
                </div>

                <div className="flex items-center gap-2 mt-7 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={prefs.doNotContact}
                    onChange={(e) => setPrefs((p) => ({ ...p, doNotContact: e.target.checked }))}
                    className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                  />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Do Not Contact</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={prefs.smsOptIn}
                    onChange={(e) => setPrefs((p) => ({ ...p, smsOptIn: e.target.checked }))}
                    className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                  />
                  SMS Opt-in
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={prefs.emailOptIn}
                    onChange={(e) => setPrefs((p) => ({ ...p, emailOptIn: e.target.checked }))}
                    className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                  />
                  Email Opt-in
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={prefs.marketingOptIn}
                    onChange={(e) => setPrefs((p) => ({ ...p, marketingOptIn: e.target.checked }))}
                    className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                  />
                  Marketing Opt-in
                </label>
              </div>

              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Tip: Keep opt-ins explicit. Later you can store an audit trail (timestamp + source).
              </div>
            </div>
          </Section>

          {/* ===== MEMBERSHIPS */}
          <Section
            k="membership"
            title="Memberships & Plans"
            subtitle="Gym/yoga memberships, dental plans, retainers, service packages."
            right={
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={membershipsEnabled}
                  onChange={(e) => setMembershipsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                />
                Enable
              </label>
            }
          >
            {!membershipsEnabled ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Turn this on if the customer has a subscription, membership, class pack, or contract.
              </div>
            ) : (
              <div className="space-y-4">
                {memberships.map((m, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-black/10 bg-zinc-50/60 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Membership #{idx + 1}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          Track status, renewal, pricing, and entitlements.
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMemberships((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-300"
                          disabled={memberships.length === 1}
                          title={memberships.length === 1 ? "Keep at least one membership row" : "Remove"}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={Label}>Plan Name</label>
                        <input
                          value={m.planName}
                          onChange={(e) => {
                            const v = e.target.value;
                            setMemberships((prev) => prev.map((x, i) => (i === idx ? { ...x, planName: v } : x)));
                          }}
                          placeholder="Gold Membership / Dental Plan / Unlimited Yoga"
                          className={Input}
                        />
                      </div>

                      <div>
                        <label className={Label}>Status</label>
                        <select
                          value={m.status}
                          onChange={(e) => {
                            const v = e.target.value as MembershipStatus;
                            setMemberships((prev) => prev.map((x, i) => (i === idx ? { ...x, status: v } : x)));
                          }}
                          className={Input}
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="past_due">Past Due</option>
                          <option value="canceled">Canceled</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className={Label}>Cadence</label>
                        <select
                          value={m.cadence}
                          onChange={(e) => {
                            const v = e.target.value as MembershipCadence;
                            setMemberships((prev) => prev.map((x, i) => (i === idx ? { ...x, cadence: v } : x)));
                          }}
                          className={Input}
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className={Label}>Price</label>
                        <input
                          value={m.price}
                          onChange={(e) => {
                            const v = e.target.value;
                            setMemberships((prev) => prev.map((x, i) => (i === idx ? { ...x, price: v } : x)));
                          }}
                          placeholder="79"
                          className={Input}
                        />
                      </div>

                      <div>
                        <label className={Label}>Currency</label>
                        <input
                          value={m.currency}
                          onChange={(e) => {
                            const v = e.target.value.toUpperCase().slice(0, 3);
                            setMemberships((prev) => prev.map((x, i) => (i === idx ? { ...x, currency: v } : x)));
                          }}
                          placeholder="USD"
                          className={Input}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className={Label}>Start Date</label>
                        <input
                          type="date"
                          value={m.startDate}
                          onChange={(e) => {
                            const v = e.target.value;
                            setMemberships((prev) => prev.map((x, i) => (i === idx ? { ...x, startDate: v } : x)));
                          }}
                          className={Input}
                        />
                      </div>

                      <div>
                        <label className={Label}>Renewal Date</label>
                        <input
                          type="date"
                          value={m.renewalDate}
                          onChange={(e) => {
                            const v = e.target.value;
                            setMemberships((prev) => prev.map((x, i) => (i === idx ? { ...x, renewalDate: v } : x)));
                          }}
                          className={Input}
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-7 sm:mt-0">
                        <input
                          type="checkbox"
                          checked={m.autoRenew}
                          onChange={(e) => {
                            const v = e.target.checked;
                            setMemberships((prev) => prev.map((x, i) => (i === idx ? { ...x, autoRenew: v } : x)));
                          }}
                          className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                        />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Auto-Renew</span>
                      </div>
                    </div>

                    {/* Entitlements */}
                    <div className="mt-5">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-white">Entitlements</div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Works for gym/yoga (visits/credits), dental plans (discount), retainers (hours).
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div>
                          <label className={Label}>Visits / Period</label>
                          <input
                            value={m.entitlements.visitsPerPeriod || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMemberships((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, entitlements: { ...x.entitlements, visitsPerPeriod: v } } : x
                                )
                              );
                            }}
                            placeholder="12"
                            className={Input}
                          />
                        </div>

                        <div>
                          <label className={Label}>Credits / Period</label>
                          <input
                            value={m.entitlements.creditsPerPeriod || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMemberships((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, entitlements: { ...x.entitlements, creditsPerPeriod: v } } : x
                                )
                              );
                            }}
                            placeholder="8"
                            className={Input}
                          />
                        </div>

                        <div>
                          <label className={Label}>Hours / Period</label>
                          <input
                            value={m.entitlements.hoursPerPeriod || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMemberships((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, entitlements: { ...x.entitlements, hoursPerPeriod: v } } : x
                                )
                              );
                            }}
                            placeholder="10"
                            className={Input}
                          />
                        </div>

                        <div>
                          <label className={Label}>Discount %</label>
                          <input
                            value={m.entitlements.discountPercent || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMemberships((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, entitlements: { ...x.entitlements, discountPercent: v } } : x
                                )
                              );
                            }}
                            placeholder="15"
                            className={Input}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Freeze */}
                    <div className="mt-5 rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-black/20">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-zinc-900 dark:text-white">Freeze / Pause Policy</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            Useful for gym memberships (freeze days per year).
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          <input
                            type="checkbox"
                            checked={!!m.freezeAllowed}
                            onChange={(e) => {
                              const v = e.target.checked;
                              setMemberships((prev) => prev.map((x, i) => (i === idx ? { ...x, freezeAllowed: v } : x)));
                            }}
                            className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                          />
                          Allow freeze
                        </label>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={Label}>Freeze Days / Year</label>
                          <input
                            value={m.freezeDaysPerYear || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMemberships((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, freezeDaysPerYear: v } : x))
                              );
                            }}
                            placeholder="30"
                            className={Input}
                            disabled={!m.freezeAllowed}
                          />
                        </div>

                        <div>
                          <label className={Label}>Membership Notes</label>
                          <input
                            value={m.notes || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMemberships((prev) => prev.map((x, i) => (i === idx ? { ...x, notes: v } : x)));
                            }}
                            placeholder="Ex: Family plan, corporate rate, etc."
                            className={Input}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setMemberships((p) => [...p, defaultMembership()])}
                    className="rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
                  >
                    + Add Membership
                  </button>

                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Later: you’ll compute usage + renewal automations from these fields.
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* ===== PATIENT / INSURANCE */}
          <Section
            k="patient"
            title="Patient & Insurance"
            subtitle="Optional. Dental/medical clinics can store patient + insurance info."
            right={
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={patientEnabled}
                    onChange={(e) => setPatientEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                  />
                  Patient
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={insuranceEnabled}
                    onChange={(e) => setInsuranceEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                  />
                  Insurance
                </label>
              </div>
            }
          >
            {!patientEnabled && !insuranceEnabled ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Enable Patient and/or Insurance if you’re serving dental/medical businesses.
              </div>
            ) : (
              <div className="space-y-5">
                {patientEnabled && (
                  <div className="rounded-2xl border border-black/10 bg-zinc-50/60 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white">Patient Info</div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className={Label}>Date of Birth</label>
                        <input
                          type="date"
                          value={patient.dob || ""}
                          onChange={(e) => setPatient((p) => ({ ...p, dob: e.target.value }))}
                          className={Input}
                        />
                      </div>

                      <div>
                        <label className={Label}>Gender</label>
                        <select
                          value={patient.gender || ""}
                          onChange={(e) => setPatient((p) => ({ ...p, gender: e.target.value as any }))}
                          className={Input}
                        >
                          <option value="">—</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="nonbinary">Non-binary</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>

                      <div>
                        <label className={Label}>Preferred Provider</label>
                        <input
                          value={patient.preferredProvider || ""}
                          onChange={(e) => setPatient((p) => ({ ...p, preferredProvider: e.target.value }))}
                          placeholder="Dr. Smith"
                          className={Input}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={Label}>Last Visit</label>
                        <input
                          type="date"
                          value={patient.lastVisit || ""}
                          onChange={(e) => setPatient((p) => ({ ...p, lastVisit: e.target.value }))}
                          className={Input}
                        />
                      </div>

                      <div>
                        <label className={Label}>Next Recall Due</label>
                        <input
                          type="date"
                          value={patient.nextRecallDue || ""}
                          onChange={(e) => setPatient((p) => ({ ...p, nextRecallDue: e.target.value }))}
                          className={Input}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={Label}>Allergies</label>
                      <textarea
                        value={patient.allergies || ""}
                        onChange={(e) => setPatient((p) => ({ ...p, allergies: e.target.value }))}
                        placeholder="List allergies (optional)"
                        rows={2}
                        className={Textarea}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={Label}>Conditions</label>
                        <textarea
                          value={patient.conditions || ""}
                          onChange={(e) => setPatient((p) => ({ ...p, conditions: e.target.value }))}
                          placeholder="Conditions (optional)"
                          rows={2}
                          className={Textarea}
                        />
                      </div>

                      <div>
                        <label className={Label}>Medications</label>
                        <textarea
                          value={patient.medications || ""}
                          onChange={(e) => setPatient((p) => ({ ...p, medications: e.target.value }))}
                          placeholder="Medications (optional)"
                          rows={2}
                          className={Textarea}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {insuranceEnabled && (
                  <div className="rounded-2xl border border-black/10 bg-zinc-50/60 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white">Insurance</div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={Label}>Provider</label>
                        <input
                          value={insurance.provider || ""}
                          onChange={(e) => setInsurance((p) => ({ ...p, provider: e.target.value }))}
                          placeholder="Aetna, Delta Dental, etc."
                          className={Input}
                        />
                      </div>

                      <div>
                        <label className={Label}>Plan Name</label>
                        <input
                          value={insurance.planName || ""}
                          onChange={(e) => setInsurance((p) => ({ ...p, planName: e.target.value }))}
                          placeholder="PPO / HMO / Plan Name"
                          className={Input}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className={Label}>Member ID</label>
                        <input
                          value={insurance.memberId || ""}
                          onChange={(e) => setInsurance((p) => ({ ...p, memberId: e.target.value }))}
                          placeholder="Member ID"
                          className={Input}
                        />
                      </div>

                      <div>
                        <label className={Label}>Group ID</label>
                        <input
                          value={insurance.groupId || ""}
                          onChange={(e) => setInsurance((p) => ({ ...p, groupId: e.target.value }))}
                          placeholder="Group ID"
                          className={Input}
                        />
                      </div>

                      <div>
                        <label className={Label}>Insurance Phone</label>
                        <input
                          value={insurance.phone || ""}
                          onChange={(e) => setInsurance((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="+1 (800) 123-4567"
                          className={Input}
                        />
                      </div>
                    </div>

                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                      Later: you can store multiple insurance policies per patient (primary/secondary).
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* ===== EMERGENCY + HOUSEHOLD */}
          <Section
            k="emergency"
            title="Emergency & Household"
            subtitle="Emergency contact and family/household members (great for family plans)."
            right={
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={emergencyEnabled}
                    onChange={(e) => setEmergencyEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                  />
                  Emergency
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={householdEnabled}
                    onChange={(e) => setHouseholdEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                  />
                  Household
                </label>
              </div>
            }
          >
            {!emergencyEnabled && !householdEnabled ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Enable emergency contact and/or household members if needed.
              </div>
            ) : (
              <div className="space-y-5">
                {emergencyEnabled && (
                  <div className="rounded-2xl border border-black/10 bg-zinc-50/60 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white">Emergency Contact</div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className={Label}>Name</label>
                        <input
                          value={emergency.name || ""}
                          onChange={(e) => setEmergency((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Jane Doe"
                          className={Input}
                        />
                      </div>

                      <div>
                        <label className={Label}>Relation</label>
                        <input
                          value={emergency.relation || ""}
                          onChange={(e) => setEmergency((p) => ({ ...p, relation: e.target.value }))}
                          placeholder="Spouse / Parent / Friend"
                          className={Input}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={Label}>Phone</label>
                      <input
                        value={emergency.phone || ""}
                        onChange={(e) => setEmergency((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                        className={Input}
                      />
                    </div>
                  </div>
                )}

                {householdEnabled && (
                  <div className="rounded-2xl border border-black/10 bg-zinc-50/60 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900 dark:text-white">Household Members</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          Useful for family plans (dental, gym) or parent/child accounts.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setHousehold((p) => [...p, { name: "", relation: "", dob: "" }])}
                        className="rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
                      >
                        + Add
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {household.length === 0 ? (
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          No household members added yet.
                        </div>
                      ) : (
                        household.map((h, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-black/20"
                          >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                              <div className="sm:col-span-3">
                                <label className={Label}>Name</label>
                                <input
                                  value={h.name}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setHousehold((p) => p.map((x, i) => (i === idx ? { ...x, name: v } : x)));
                                  }}
                                  placeholder="Child / Spouse name"
                                  className={Input}
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className={Label}>Relation</label>
                                <input
                                  value={h.relation || ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setHousehold((p) => p.map((x, i) => (i === idx ? { ...x, relation: v } : x)));
                                  }}
                                  placeholder="Child, Spouse"
                                  className={Input}
                                />
                              </div>

                              <div className="sm:col-span-1">
                                <label className={Label}>DOB</label>
                                <input
                                  type="date"
                                  value={h.dob || ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setHousehold((p) => p.map((x, i) => (i === idx ? { ...x, dob: v } : x)));
                                  }}
                                  className={Input}
                                />
                              </div>
                            </div>

                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setHousehold((p) => p.filter((_, i) => i !== idx))}
                                className="px-3 py-2 rounded-xl text-xs font-semibold border border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* ===== CUSTOM FIELDS */}
          <Section
            k="custom"
            title="Custom Fields"
            subtitle="Tenant-specific fields. Today: UI-only. Later: render from a per-tenant schema."
            right={
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={customEnabled}
                  onChange={(e) => setCustomEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-black/20 text-zinc-900 dark:border-white/20 dark:text-white"
                />
                Enable
              </label>
            }
          >
            {!customEnabled ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Enable this if you want business-specific fields (ex: “Locker #”, “Next cleaning due”, “Trainer”, “VIN”).
              </div>
            ) : (
              <div className="space-y-4">
                {customFields.map((f, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-black/10 bg-zinc-50/60 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                      <div className="sm:col-span-2">
                        <label className={Label}>Key</label>
                        <input
                          value={f.key}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\s+/g, "_").toLowerCase();
                            setCustomFields((p) => p.map((x, i) => (i === idx ? { ...x, key: v } : x)));
                          }}
                          placeholder="locker_number"
                          className={Input}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className={Label}>Label</label>
                        <input
                          value={f.label}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomFields((p) => p.map((x, i) => (i === idx ? { ...x, label: v } : x)));
                          }}
                          placeholder="Locker Number"
                          className={Input}
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className={Label}>Type</label>
                        <select
                          value={f.type}
                          onChange={(e) => {
                            const v = e.target.value as CustomFieldType;
                            setCustomFields((p) => p.map((x, i) => (i === idx ? { ...x, type: v } : x)));
                          }}
                          className={Input}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Select</option>
                          <option value="multi_select">Multi-select</option>
                          <option value="boolean">Boolean</option>
                        </select>
                      </div>

                      <div className="sm:col-span-1">
                        <label className={Label}>Value</label>
                        <input
                          value={f.value}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomFields((p) => p.map((x, i) => (i === idx ? { ...x, value: v } : x)));
                          }}
                          placeholder="123"
                          className={Input}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCustomFields((p) => p.filter((_, i) => i !== idx))}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCustomFields((p) => [
                        ...p,
                        { key: "", label: "", type: "text", value: "" },
                      ])
                    }
                    className="rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
                  >
                    + Add Custom Field
                  </button>

                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Later: you’ll define these fields per tenant and render automatically.
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-black/10 pt-4 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10 disabled:opacity-50 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              {loading ? "Creating..." : "Create Customer"}
            </button>
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Note: This is UI-first. When you wire MongoDB, store modules as optional subdocuments so it stays universal.
          </div>
        </form>
      </div>
    </div>
  );
}
