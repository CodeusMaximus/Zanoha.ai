"use client";

import { useMemo, useState } from "react";
import { X, Trash2, Save, CreditCard, User } from "lucide-react";
import CallCustomerButton from "@/app/components/CallCustomerButton";

type CustomerSlim = {
  id: string;
  name: string;
  phone: string;
  email: string;
  isReturning: boolean;
};

type CustomerFull = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  isReturning?: boolean;
};

export default function CustomersListClient({
  customers,
  businessId,
}: {
  customers: CustomerSlim[];
  businessId: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState<CustomerFull | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>("");

  const activeSlim = useMemo(
    () => customers.find((c) => c.id === activeId) || null,
    [customers, activeId]
  );

  async function openModal(id: string) {
    setError("");
    setOpen(true);
    setActiveId(id);
    setCustomer(null);
    setLoading(true);

    try {
      const r = await fetch(`/api/customers/${id}`, { method: "GET" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Failed to load customer");

      setCustomer(d.customer);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setOpen(false);
    setActiveId(null);
    setCustomer(null);
    setError("");
  }

  async function saveChanges() {
    if (!customer?.id) return;
    setSaving(true);
    setError("");

    try {
      const r = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customer.name,
          phone: customer.phone || "",
          email: customer.email || "",
          notes: customer.notes || "",
          isReturning: !!customer.isReturning,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Failed to save");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer() {
    if (!customer?.id) return;
    if (!confirm("Delete this customer permanently?")) return;

    setDeleting(true);
    setError("");

    try {
      const r = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Delete failed");

      // easiest: refresh page to update list
      window.location.reload();
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white ring-1 ring-black/5
                      dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-zinc-50 px-5 py-3
                        dark:border-white/10 dark:bg-black/20">
          <div className="text-sm font-semibold text-zinc-900 dark:text-white">
            Customer List
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">Click a customer to open profile</div>
        </div>

        <div className="divide-y divide-black/10 dark:divide-white/10">
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => openModal(c.id)}
              className="w-full text-left px-5 py-4 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                      {c.name}
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-1 text-[11px] ring-1",
                        c.isReturning
                          ? "bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 dark:text-emerald-200"
                          : "bg-blue-500/10 text-blue-800 ring-blue-500/20 dark:text-blue-200",
                      ].join(" ")}
                    >
                      {c.isReturning ? "Returning" : "New"}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="truncate">
                      📞 <span className="text-zinc-800 dark:text-zinc-300">{c.phone || "—"}</span>
                    </span>
                    <span className="truncate">
                      ✉️ <span className="text-zinc-800 dark:text-zinc-300">{c.email || "—"}</span>
                    </span>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CallCustomerButton
                    customerId={c.id}
                    customerName={c.name}
                    customerPhone={c.phone}
                    businessId={businessId}
                  />
                  <button
                    onClick={() => openModal(c.id)}
                    className="rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10
                               dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
                  >
                    View
                  </button>
                </div>
              </div>
            </button>
          ))}

          {!customers.length && (
            <div className="px-5 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400">
              No customers found.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white ring-1 ring-black/5
                          dark:border-white/10 dark:bg-[#0f1420] dark:ring-white/10 overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4
                            dark:border-white/10">
              <div className="flex items-center gap-2">
                <User size={18} className="text-zinc-600 dark:text-zinc-300" />
                <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Customer Profile
                </div>
              </div>

              <button
                onClick={closeModal}
                className="grid h-9 w-9 place-items-center rounded-xl bg-black/5 ring-1 ring-black/10 hover:bg-black/10
                           dark:bg-white/10 dark:ring-white/15 dark:hover:bg-white/15"
                aria-label="Close"
              >
                <X size={16} className="text-zinc-800 dark:text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">
                  {error}
                </div>
              )}

              {loading && (
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  Loading…
                </div>
              )}

              {!loading && customer && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Name">
                      <input
                        value={customer.name}
                        onChange={(e) =>
                          setCustomer((c) => (c ? { ...c, name: e.target.value } : c))
                        }
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-black/5
                                   dark:border-white/10 dark:bg-black/30 dark:text-white dark:ring-white/10"
                      />
                    </Field>

                    <Field label="Returning customer">
                      <select
                        value={customer.isReturning ? "yes" : "no"}
                        onChange={(e) =>
                          setCustomer((c) =>
                            c ? { ...c, isReturning: e.target.value === "yes" } : c
                          )
                        }
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-black/5
                                   dark:border-white/10 dark:bg-black/30 dark:text-white dark:ring-white/10"
                      >
                        <option value="no">New</option>
                        <option value="yes">Returning</option>
                      </select>
                    </Field>

                    <Field label="Phone">
                      <input
                        value={customer.phone || ""}
                        onChange={(e) =>
                          setCustomer((c) => (c ? { ...c, phone: e.target.value } : c))
                        }
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-black/5
                                   dark:border-white/10 dark:bg-black/30 dark:text-white dark:ring-white/10"
                      />
                    </Field>

                    <Field label="Email">
                      <input
                        value={customer.email || ""}
                        onChange={(e) =>
                          setCustomer((c) => (c ? { ...c, email: e.target.value } : c))
                        }
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-black/5
                                   dark:border-white/10 dark:bg-black/30 dark:text-white dark:ring-white/10"
                      />
                    </Field>
                  </div>

                  <Field label="Notes">
                    <textarea
                      value={customer.notes || ""}
                      onChange={(e) =>
                        setCustomer((c) => (c ? { ...c, notes: e.target.value } : c))
                      }
                      rows={5}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-black/5
                                 dark:border-white/10 dark:bg-black/30 dark:text-white dark:ring-white/10"
                    />
                  </Field>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                    <a
                      href={`/dashboard/payments?customerId=${customer.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-500/20 hover:bg-emerald-500/15
                                 dark:text-emerald-200"
                    >
                      <CreditCard size={16} />
                      Bill customer
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={deleteCustomer}
                        disabled={deleting}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-500/20 hover:bg-red-500/15 disabled:opacity-60
                                   dark:text-red-200"
                      >
                        <Trash2 size={16} />
                        {deleting ? "Deleting…" : "Delete"}
                      </button>

                      <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60
                                   dark:bg-white dark:text-black dark:hover:bg-zinc-100"
                      >
                        <Save size={16} />
                        {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!loading && !customer && !error && (
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  No customer loaded.
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-black/10 px-5 py-3 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
              Tip: Billing button can open a “Create invoice / Checkout link” flow next.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium text-zinc-900 dark:text-white">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
