"use client";

import { useState } from "react";
import { toast } from "react-toastify";

export default function CallCustomerButton({
  customerId,
  customerName,
  customerPhone,
  businessId,
}: {
  customerId: string;
  customerName: string;
  customerPhone: string;
  businessId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function startCall() {
    if (!customerPhone) return toast.error("Customer has no phone number");
    setLoading(true);
    try {
      const res = await fetch("/api/twilio/call-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerName,
          to: customerPhone,
          businessId,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to start call");
      toast.success(`Calling ${customerName}…`);
    } catch (e: any) {
      toast.error(e?.message || "Call failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startCall}
      disabled={loading}
      className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-50"
    >
      {loading ? "Calling…" : "🤖 AI Call"}
    </button>
  );
}
