"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#0b0f17] dark:text-zinc-100">
      <div className="flex min-h-screen">
        <DashboardSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <div className="min-w-0 flex-1 flex flex-col">
          <DashboardTopbar onOpenMobile={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
