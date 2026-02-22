import { getDb } from "../../lib/mongodb";
import { getOrCreateBusiness } from "../../lib/business";
import DashboardGrid from "../components/DashboardGrid";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const biz = await getOrCreateBusiness();
  const db = await getDb();

  const businessId = biz._id.toString();
  const now = new Date();

  // start/end of today
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const [appointments, calls, customers, callsToday, apptsToday] = await Promise.all([
    db.collection("appointments").countDocuments({ businessId }),
    db.collection("calls").countDocuments({ businessId }),
    db.collection("customers").countDocuments({ businessId }),

    // If your call docs have a createdAt or date field, adjust here:
    db.collection("calls").countDocuments({
      businessId,
      createdAt: { $gte: start, $lte: end },
    }),

    // If your appointment docs have startISO or start, adjust here:
    db.collection("appointments").countDocuments({
      businessId,
      start: { $gte: start, $lte: end },
    }),
  ]);

  const metrics = {
    businessName: biz.name || "Dashboard",
    totals: { appointments, calls, customers },
    today: { callsToday, apptsToday },
  };

  return (
    <div className="space-y-4">
      <DashboardGrid metrics={metrics} />
    </div>
  );
}
