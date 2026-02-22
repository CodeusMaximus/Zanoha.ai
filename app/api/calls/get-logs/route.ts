import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";

export async function GET(req: Request) {
  try {
    console.log("🔄 Fetching call logs");

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");

    const { db } = await connectToDatabase();
    const collection = db.collection('call-logs');

    const query: any = {};
    if (leadId) query.leadId = leadId;
    if (status) query.status = status;

    console.log(`📋 Query:`, query);

    const logs = await collection
      .find(query)
      .sort({ initiatedAt: -1 })
      .limit(limit)
      .toArray();

    console.log(`✅ Found ${logs.length} call logs`);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("❌ Error fetching call logs:", error);
    return NextResponse.json({
      success: false,
      logs: [],
      error: error.message
    }, { status: 500 });
  }
}