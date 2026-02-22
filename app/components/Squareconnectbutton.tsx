"use client";

import { useState } from "react";

export default function SquareConnectButton({
  businessId,
  isConnected,
}: {
  businessId: string;
  isConnected: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Get Square OAuth URL
      const res = await fetch("/api/payments/square/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        // Redirect to Square OAuth
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to connect Square");
        setLoading(false);
      }
    } catch (error) {
      console.error("Square connect error:", error);
      alert("Failed to connect Square");
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Square?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/square/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error || "Failed to disconnect");
        setLoading(false);
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      alert("Failed to disconnect");
      setLoading(false);
    }
  };

  const handleManage = () => {
    // Link to Square Dashboard
    window.open("https://squareup.com/dashboard", "_blank");
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleManage}
          className="rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold text-zinc-900 ring-1 ring-black/10 hover:bg-black/10
                     dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
        >
          Manage
        </button>
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-500/20 hover:bg-red-500/15 disabled:opacity-50
                     dark:bg-red-500/20 dark:text-red-100 dark:hover:bg-red-500/25"
        >
          {loading ? "Disconnecting..." : "Disconnect"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50
                 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
    >
      {loading ? "Connecting..." : "Connect Square"}
    </button>
  );
}