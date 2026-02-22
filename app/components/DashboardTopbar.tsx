"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import DarkModeToggle from "@/app/components/DarkModeToggler";
import SupportTicketButton from "./SupportTicketButton";

type Biz = { _id: string; name: string; timezone?: string };

function titleFromPath(pathname: string) {
  if (pathname === "/dashboard") return "Overview";
  const part = pathname.split("/")[2] || "";
  return part ? part.charAt(0).toUpperCase() + part.slice(1) : "Dashboard";
}

export default function DashboardTopbar({
  onOpenMobile,
}: {
  onOpenMobile: () => void;
}) {
  const pathname = usePathname();
  const title = titleFromPath(pathname);

  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    fetch("/api/businesses/list")
      .then((r) => r.json())
      .then((d) => {
        setBusinesses(d?.businesses || []);
        setActiveId(d?.activeBusinessId || "");
      })
      .catch(() => {});
  }, []);

  async function setActive(businessId: string) {
    setActiveId(businessId);

    await fetch("/api/businesses/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    }).catch(() => {});

    window.location.reload();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/80 backdrop-blur
                       dark:border-white/10 dark:bg-black/20">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={onOpenMobile}
            className="md:hidden grid h-10 w-10 place-items-center rounded-xl bg-black/5 ring-1 ring-black/10 hover:bg-black/10
                       dark:bg-white/10 dark:ring-white/15 dark:hover:bg-white/15"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-white">
              {title}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Receptionist CRM • Admin
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tenant switcher */}
          <div className="rounded-xl bg-black/5 ring-1 ring-black/10 px-2 py-2
                          dark:bg-white/10 dark:ring-white/15">
            <select
              value={activeId}
              onChange={(e) => setActive(e.target.value)}
              className="bg-transparent text-sm text-zinc-900 outline-none dark:text-white"
            >
              <option value="">
                {activeId ? "Business" : "Select business"}
              </option>
              {businesses.map((b) => (
                <option key={b._id} value={b._id} className="text-black">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
           <SupportTicketButton />
          {/* ✅ Your existing dark mode toggle */}
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
