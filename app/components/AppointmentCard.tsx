"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AppointmentCard({ 
  appointment, 
  isPast 
}: { 
  appointment: {
    _id: string;
    source: string;
    customerName: string;
    phone: string;
    email: string;
    service: string;
    startISO: string;
    endISO: string;
    meetLink: string;
    htmlLink: string;
    googleEventId: string;
    notes: string;
  };
  isPast: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const apptDate = new Date(appointment.startISO);
  const formattedDate = apptDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = apptDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const handleRemind = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calls/remind-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment._id,
          customerPhone: appointment.phone,
          customerName: appointment.customerName,
          appointmentTime: appointment.startISO,
          service: appointment.service,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Reminder sent to ${appointment.customerName}!`);
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      alert("❌ Error sending reminder");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment._id,
          googleEventId: appointment.googleEventId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      alert("❌ Error deleting");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

return (
  <div className="relative rounded-2xl border border-black/10 bg-white p-5 shadow-sm ring-1 ring-black/5
                  dark:border-white/10 dark:bg-white/5 dark:shadow-xl dark:ring-white/10">
    <div className="absolute right-4 top-4">
      <span
        className={
          isPast
            ? "rounded-full bg-zinc-500/10 px-3 py-1 text-xs text-zinc-600 ring-1 ring-zinc-500/20 dark:text-zinc-400 dark:ring-white/0"
            : "rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300 dark:ring-white/0"
        }
      >
        {isPast ? "✓ Done" : "⏰ Soon"}
      </span>
    </div>

    <div className="mb-4">
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
        {appointment.customerName}
      </h3>
      <p className="text-sm text-purple-700 dark:text-purple-300">
        {appointment.service}
      </p>
    </div>

    <div className="mb-4 rounded-lg bg-zinc-50 px-3 py-2 ring-1 ring-black/5
                    dark:bg-white/5 dark:ring-white/10">
      <div className="text-sm font-medium text-zinc-900 dark:text-white">
        {formattedDate}
      </div>
      <div className="text-xs text-zinc-600 dark:text-zinc-400">
        {formattedTime}
      </div>
    </div>

    {appointment.phone && (
      <div className="mb-2 text-xs text-zinc-700 dark:text-zinc-300">
        📞 {appointment.phone}
      </div>
    )}
    {appointment.email && (
      <div className="mb-2 truncate text-xs text-zinc-700 dark:text-zinc-300">
        ✉️ {appointment.email}
      </div>
    )}

    {appointment.notes && (
      <div className="mb-4 rounded-lg bg-blue-500/10 p-3 ring-1 ring-blue-500/15
                      dark:bg-blue-500/5 dark:ring-blue-500/20">
        <div className="mb-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
          📝 Notes
        </div>
        <p className="text-xs text-zinc-700 dark:text-zinc-300">
          {appointment.notes}
        </p>
      </div>
    )}

    <div className="flex gap-2">
      {!isPast && appointment.phone && (
        <button
          onClick={handleRemind}
          disabled={loading}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50
                     dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/30"
        >
          {loading ? "⏳" : "📞 Remind"}
        </button>
      )}

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="flex-1 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-500/15 hover:bg-red-500/15
                     dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20 dark:hover:bg-red-500/20"
        >
          🗑️ Delete
        </button>
      ) : (
        <>
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 rounded-lg bg-black/5 px-2 py-2 text-xs font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10
                       dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-600 px-2 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50
                       dark:bg-red-500 dark:hover:bg-red-600"
          >
            Confirm
          </button>
        </>
      )}
    </div>
  </div>
);
}