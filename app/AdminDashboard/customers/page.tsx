 import Link from "next/link";
import { getDb } from "../../../lib/mongodb";
import CallCustomerButton from "@/app/components/CallCustomerButton";
import CustomersImportExport from "@/app/components/ClientImportExport";
import AddCustomerButton from "../../components/Addcustomerbutton";
import { requireActiveBusinessId, getBusinessById } from "@/lib/tenant";
import CustomersListClient from "@/app/components/CustomersListClient";
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  TrendingUp, 
  Search,
  Download,
  Upload,
  Phone,
  Mail,
  Star,
  Filter as FilterIcon,
  RefreshCcw,
} from "lucide-react";

export const runtime = "nodejs";

const PAGE_SIZE = 25;

type SearchParams = {
  page?: string;
  q?: string;
  filter?: string; // "all" | "returning" | "new"
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const { businessId } = await requireActiveBusinessId();
  const db = await getDb();
  const biz = await getBusinessById(businessId);

  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const q = (sp.q || "").trim();
  const filter = (sp.filter || "all").toLowerCase();

  const baseQuery: any = { businessId };

  if (filter === "returning") baseQuery.isReturning = true;
  if (filter === "new") baseQuery.isReturning = false;

  if (q) {
    const safe = escapeRegex(q);
    baseQuery.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      { phone: { $regex: safe, $options: "i" } },
    ];
  }

  const customersCol = db.collection("customers");

  const total = await customersCol.countDocuments(baseQuery);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const customers = await customersCol
    .find(baseQuery)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .toArray();

  const from = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, safePage * PAGE_SIZE);

  // Calculate stats
  const returningCount = await customersCol.countDocuments({ businessId, isReturning: true });
  const newCount = await customersCol.countDocuments({ businessId, isReturning: false });

  // Reduce data passed to client (string ids only)
  const customersSlim = customers.map((c: any) => ({
    id: c._id.toString(),
    name: c.name || "Unknown",
    phone: c.phone || "",
    email: c.email || "",
    isReturning: !!c.isReturning,
  }));

  return (
    <div className="min-h-[calc(100vh-64px)] transition-colors bg-neutral-50 dark:bg-[#0b0f17]">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Customers
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-zinc-300">
              Manage your customer relationships and track engagement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AddCustomerButton businessId={businessId} />
            
            <div className="rounded-xl border-2 border-neutral-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              <span className="text-zinc-900 font-bold dark:text-white">
                {biz?.name || "Business"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border-2 border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-600 dark:text-zinc-300 mb-1">
                  Total Customers
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {total}
                </div>
              </div>
              <Users className="w-8 h-8 text-neutral-400 dark:text-zinc-500" />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-emerald-400 dark:border-emerald-600 bg-white dark:bg-zinc-900 p-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                  Returning
                </div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {returningCount}
                </div>
              </div>
              <UserCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-blue-400 dark:border-blue-600 bg-white dark:bg-zinc-900 p-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  New Customers
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {newCount}
                </div>
              </div>
              <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-purple-400 dark:border-purple-600 bg-white dark:bg-zinc-900 p-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                  Retention Rate
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {total > 0 ? Math.round((returningCount / total) * 100) : 0}%
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Search & Filters Section */}
        <div className="mt-6">
          <div className="rounded-2xl border-2 border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden transition-colors shadow-sm">
            {/* Search Bar */}
            <div className="p-5 border-b-2 border-neutral-300 dark:border-zinc-700">
              <form
                method="GET"
                action="/dashboard/customers"
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-zinc-300" />
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Search name, email, or phone…"
                    className="w-full rounded-xl border-2 border-neutral-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-3 pl-10 text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:zinc-400 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                </div>

                <input type="hidden" name="filter" value={filter} />

                <button
                  type="submit"
                  className="rounded-xl bg-neutral-900 dark:bg-white px-6 py-3 text-sm font-bold text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-zinc-100 transition-colors shadow-md"
                >
                  Search
                </button>

                {(q || filter !== "all") && (
                  <Link
                    href="/dashboard/customers"
                    className="rounded-xl bg-neutral-100 dark:bg-zinc-700 px-6 py-3 text-sm font-bold text-neutral-900 dark:text-white border-2 border-neutral-300 dark:border-zinc-600 hover:bg-neutral-200 dark:hover:bg-zinc-600 transition-colors"
                  >
                    Reset
                  </Link>
                )}
              </form>
            </div>

            {/* Filter Pills & Actions */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-neutral-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-xs font-bold text-neutral-700 dark:text-zinc-200 flex items-center gap-2">
                  <FilterIcon size={14} />
                  Filter:
                </div>
                <FilterPill active={filter === "all"} href={buildHref({ q, filter: "all", page: 1 })}>
                  All
                </FilterPill>
                <FilterPill active={filter === "returning"} href={buildHref({ q, filter: "returning", page: 1 })}>
                  Returning
                </FilterPill>
                <FilterPill active={filter === "new"} href={buildHref({ q, filter: "new", page: 1 })}>
                  New
                </FilterPill>
              </div>

              <div className="flex items-center gap-2">
                <CustomersImportExport businessId={businessId} />
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {total > 0 && (
          <div className="mt-6 rounded-xl border-2 border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-3 transition-colors shadow-sm">
            <div className="text-sm font-semibold text-neutral-700 dark:text-zinc-200">
              Showing{" "}
              <span className="text-neutral-900 font-bold dark:text-white">
                {from}
              </span>
              –
              <span className="text-neutral-900 font-bold dark:text-white">
                {to}
              </span>{" "}
              of{" "}
              <span className="text-neutral-900 font-bold dark:text-white">
                {total}
              </span>{" "}
              customers
            </div>
          </div>
        )}

        {/* Customer List */}
        <div className="mt-6">
          <CustomersListClient
            customers={customersSlim}
            businessId={businessId}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 rounded-2xl border-2 border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-4 transition-colors shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-neutral-700 dark:text-zinc-200">
                Page{" "}
                <span className="text-neutral-900 font-bold dark:text-white">
                  {safePage}
                </span>{" "}
                of{" "}
                <span className="text-neutral-900 font-bold dark:text-white">
                  {totalPages}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <PageButton 
                  disabled={safePage <= 1} 
                  href={buildHref({ q, filter, page: safePage - 1 })}
                >
                  ← Prev
                </PageButton>

                {getPageWindow(safePage, totalPages, 5).map((p, idx) =>
                  p === "…" ? (
                    <span 
                      key={`dots-${idx}`} 
                      className="px-2 text-sm font-bold text-neutral-500 dark:text-zinc-400"
                    >
                      …
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={buildHref({ q, filter, page: p })}
                      className={[
                        "rounded-xl px-4 py-2 text-sm font-bold border-2 transition-colors",
                        p === safePage
                          ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white"
                          : "bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-zinc-600 hover:bg-neutral-100 dark:hover:bg-zinc-700",
                      ].join(" ")}
                    >
                      {p}
                    </Link>
                  )
                )}

                <PageButton 
                  disabled={safePage >= totalPages} 
                  href={buildHref({ q, filter, page: safePage + 1 })}
                >
                  Next →
                </PageButton>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {total === 0 && (
          <div className="mt-6 rounded-2xl border-2 border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-12 transition-colors shadow-sm">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto text-neutral-400 dark:text-zinc-500 mb-4" />
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                No customers found
              </h3>
              <p className="text-sm font-medium text-neutral-600 dark:text-zinc-300 mb-6">
                {q || filter !== "all" 
                  ? "Try adjusting your search or filters."
                  : "Get started by adding your first customer."}
              </p>
              {!q && filter === "all" && (
                <AddCustomerButton businessId={businessId} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPill({ 
  href, 
  active, 
  children 
}: { 
  href: string; 
  active?: boolean; 
  children: React.ReactNode 
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-4 py-2 text-xs font-bold border-2 transition-colors",
        active
          ? "bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-900 dark:border-white"
          : "bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-zinc-600 hover:bg-neutral-100 dark:hover:bg-zinc-700",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function PageButton({ 
  href, 
  disabled, 
  children 
}: { 
  href: string; 
  disabled?: boolean; 
  children: React.ReactNode 
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-xl bg-neutral-100 dark:bg-zinc-800 px-4 py-2 text-sm font-bold text-neutral-400 dark:text-zinc-500 border-2 border-neutral-300 dark:border-zinc-700">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-xl bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-bold text-neutral-900 dark:text-white border-2 border-neutral-300 dark:border-zinc-600 hover:bg-neutral-100 dark:hover:bg-zinc-700 transition-colors"
    >
      {children}
    </Link>
  );
}

function buildHref({ q, filter, page }: { q?: string; filter?: string; page?: number }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (filter && filter !== "all") params.set("filter", filter);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/dashboard/customers${qs ? `?${qs}` : ""}`;
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getPageWindow(current: number, total: number, maxButtons: number) {
  if (total <= maxButtons + 2) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: Array<number | "…"> = [];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  pages.push(1);

  if (left > 2) pages.push("…");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < total - 1) pages.push("…");

  pages.push(total);

  return pages;
}