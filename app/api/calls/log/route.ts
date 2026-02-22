import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    console.log("🔄 Starting call log creation");

    const data = await req.json();
    const { callSid, leadId, businessName, phone, userId } = data;

    console.log(`📞 Logging call: ${callSid} to ${businessName}`);

    if (!callSid || !leadId || !phone) {
      console.log("❌ Missing required call data");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      console.log("🔌 Connecting to MongoDB...");
      const { db } = await connectToDatabase();
      console.log("✅ Connected to MongoDB successfully");

      const collection = db.collection('call-logs');
      console.log("📋 Using collection: call-logs");

      const callLog = {
        callSid,
        leadId,
        businessName,
        phone,
        userId: userId || "system",
        status: "initiated",
        direction: "outbound",
        conversationLog: [],
        qualification: {},
        initiatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log("💾 Saving call log to MongoDB");
      const result = await collection.insertOne(callLog);
      console.log(`✅ Call log saved:`, result.insertedId);

      return NextResponse.json({
        success: true,
        message: "Call log created",
        id: result.insertedId
      });
    } catch (dbError: any) {
      console.error("❌ MongoDB Error:", dbError);
      return NextResponse.json({
        error: "Database error",
        details: dbError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("❌ General Error:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error.message
    }, { status: 500 });
  }
}