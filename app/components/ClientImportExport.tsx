"use client";

import { useRef, useState } from "react";

export default function CustomersImportExport({ businessId }: { businessId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function onImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMsg("Choose a CSV file first.");
      return;
    }

    setBusy(true);
    setMsg("");

    try {
      const fd = new FormData();
      fd.append("businessId", businessId);
      fd.append("file", file);

      const res = await fetch("/api/customers/import", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.error || "Import failed.");
        return;
      }

      setMsg(`Imported ✅ Inserted: ${data.inserted}, Updated: ${data.updated}, Skipped: ${data.skipped}`);
      // refresh the server component page
      window.location.reload();
    } catch (e: any) {
      setMsg(e?.message || "Import failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const exportHref = `/api/customers/export?businessId=${encodeURIComponent(businessId)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10 cursor-pointer
                        dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15">
        Choose CSV
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" />
      </label>

      <button
        onClick={onImport}
        disabled={busy}
        className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60
                   dark:bg-white dark:text-black dark:hover:bg-zinc-100"
      >
        {busy ? "Importing…" : "Import"}
      </button>

      <a
        href={exportHref}
        className="rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10
                   dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
      >
        Export CSV
      </a>

      {msg && (
        <span className="text-xs text-zinc-600 dark:text-zinc-400 ml-1">
          {msg}
        </span>
      )}
    </div>
  );
}
