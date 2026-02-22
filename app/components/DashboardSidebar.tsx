 "use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import LogoutButton from "./LogoutButton";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  PhoneCall,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Coins,
  Headphones,
  Pen,
  Inbox,
  UserPlus,
  BarChart3,
  Zap,
  BookOpen,
  Plug,
} from "lucide-react";

type Props = {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

// Add keys as you implement badge counts server-side.
type BadgeKey =
  | "customers"
  | "calls"
  | "appointments"
  | "leads"
  | "inbox"
  | "tasks";

type BadgeMap = Partial<Record<BadgeKey, number>>;

type NavItem = {
  href: string;
  label: string;
  icon: any;
  badgeKey?: BadgeKey;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Core",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      {
        href: "/dashboard/inbox",
        label: "Inbox",
        icon: Inbox,
        badgeKey: "inbox",
      },
      {
        href: "/dashboard/leads",
        label: "Leads",
        icon: UserPlus,
        badgeKey: "leads",
      },
      {
        href: "/dashboard/appointments",
        label: "Appointments",
        icon: ClipboardList,
        badgeKey: "appointments",
      },
      { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
      { href: "/dashboard/taskmanager", label: "Tasks", icon: Pen, badgeKey: "tasks" },
      {
        href: "/dashboard/customers",
        label: "Customers",
        icon: Users,
        badgeKey: "customers",
      },
      {
        href: "/dashboard/calls",
        label: "Calls",
        icon: PhoneCall,
        badgeKey: "calls",
      },
    ],
  },
  {
    title: "AI & Automation",
    items: [
      { href: "/dashboard/MyReceptionist", label: "My Receptionist", icon: Headphones },
      { href: "/dashboard/Automationspage", label: "Automations", icon: Zap },
      { href: "/dashboard/knowledge", label: "Knowledge Base", icon: BookOpen },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/dashboard/Payments", label: "Payments", icon: Coins },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/IntegrationsPage", label: "Integrations", icon: Plug },
    ],
  },
  {
    title: "System",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
  },
];

function Tooltip({ show, text }: { show: boolean; text: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl
                     bg-black/80 px-3 py-1 text-xs text-white ring-1 ring-white/10"
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DashboardSidebar({ mobileOpen, setMobileOpen }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hoverLabel, setHoverLabel] = useState<string>("");
  const [badges, setBadges] = useState<BadgeMap>({});
  const [branding, setBranding] = useState<{ businessName: string; logoUrl: string | null } | null>(null);

useEffect(() => {
  fetch("/api/tenant/branding")
    .then((r) => r.json())
    .then((d) => {
      if (d?.ok) setBranding(d.branding);
    })
    .catch(() => {});
}, [pathname]);


  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);

  useEffect(() => {
    fetch("/api/dashboard/badges")
      .then((r) => r.json())
      .then((d) => setBadges(d?.badges || {}))
      .catch(() => {});
  }, [pathname]);

  function toggle() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  const width = collapsed ? 84 : 280;

  const flatNav = useMemo(() => navSections.flatMap((s) => s.items), []);
  const activeLabel = useMemo(() => {
    const found = flatNav.find((l) => pathname === l.href || pathname.startsWith(l.href + "/"));
    return found?.label || "Admin Dashboard";
  }, [pathname, flatNav]);

  const content = (
    <motion.aside
      animate={{ width }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="h-full shrink-0 border-r border-white/10 bg-[#0a0e14] flex flex-col relative"
    >
     {/* Header card */}
<div className="p-5">
  <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-4 ring-1 ring-white/10">
    {!collapsed ? (
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="h-50 w-50 rounded-xl bg-white/5 ring-1 ring-white/10 overflow-hidden grid place-items-center">
          {branding?.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt="Tenant logo"
              width={100}
              height={100}
              className="h-50 w-50 object-cover"
              unoptimized
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-white/10 ring-1 ring-white/10 grid place-items-center text-xs font-bold text-white/80">
              LOGO
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {branding?.businessName || activeLabel}
          </div>
          <div className="mt-1 text-xs text-zinc-400 truncate">
            {branding?.logoUrl ? "Branding active" : "Upload your logo in Settings"}
          </div>
        </div>
      </div>
    ) : (
      <div className="grid place-items-center">
        <div className="h-10 w-10 rounded-xl bg-white/5 ring-1 ring-white/10 overflow-hidden grid place-items-center">
          {branding?.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt="Tenant logo"
              width={40}
              height={40}
              className="h-10 w-10 object-cover"
              unoptimized
            />
          ) : (
            <div className="text-center text-[11px] font-bold text-white">MD</div>
          )}
        </div>
      </div>
    )}

    {/* Collapse toggle (desktop) */}
    <button
      type="button"
      onClick={toggle}
      className="absolute -right-3 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full
                 border border-white/10 bg-[#0a0e14] text-zinc-400 hover:text-white"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
    </button>
  </div>
</div>


      {/* Nav */}
      <nav className="px-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-2">
            {!collapsed && (
              <div className="px-3 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
                {section.title}
              </div>
            )}

            <div className="space-y-1">
              {section.items.map((l) => {
                const href = l.href;
                const active = pathname === href || pathname.startsWith(href + "/");
                const Icon = l.icon;
                const badgeVal = l.badgeKey ? badges[l.badgeKey] : undefined;

                return (
                  <div key={href} className="relative">
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        "group flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition relative",
                        active
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-white/5 bg-white/0 text-zinc-300 hover:bg-white/5 hover:text-white",
                        collapsed ? "justify-center" : "justify-between",
                      ].join(" ")}
                      onMouseEnter={() => collapsed && setHoverLabel(l.label)}
                      onMouseLeave={() => setHoverLabel("")}
                    >
                      <div
                        className={[
                          "flex items-center gap-3",
                          collapsed ? "justify-center" : "",
                        ].join(" ")}
                      >
                        <Icon size={18} />
                        {!collapsed && <span>{l.label}</span>}
                      </div>

                      {!collapsed && typeof badgeVal === "number" && (
                        <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-200 ring-1 ring-white/10">
                          {badgeVal}
                        </span>
                      )}

                      {/* collapsed badge dot */}
                      {collapsed && typeof badgeVal === "number" && badgeVal > 0 && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white/80" />
                      )}
                    </Link>

                    <Tooltip show={collapsed && hoverLabel === l.label} text={l.label} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Logout */}
      <div className="p-5">
        <LogoutButton />
      </div>
    </motion.aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">{content}</div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-0 bottom-0 z-50"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <div className="h-full w-[280px] relative">
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="absolute right-3 top-3 z-50 grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 hover:bg-white/15"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
                {content}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
