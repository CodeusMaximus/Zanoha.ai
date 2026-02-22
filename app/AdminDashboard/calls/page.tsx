import { getDb } from "../../../lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";
import CallsClient from "@/app/components/CallsClients";

export default async function CallsPage() {
  const biz = await getOrCreateBusiness();
  const db = await getDb();

  const calls = await db
    .collection("calls")
    .find({ businessId: biz._id.toString() })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  // Serialize calls data
  const serializedCalls = calls.map((c: any) => ({
    _id: c._id.toString(),
    status: c.status || "completed",
    callSid: c.callSid || null,
    fromPhone: c.fromPhone || "Unknown",
    toPhone: c.toPhone || "Unknown",
    transcript: c.transcript || null,
    duration: c.duration || null,
    createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
    direction: c.direction || (c.fromPhone?.includes('+1') ? 'inbound' : 'outbound'), // Auto-detect if not set
    cost: c.cost || null,
    recordingUrl: c.recordingUrl || null,
  }));

  return <CallsClient calls={serializedCalls} />;
}