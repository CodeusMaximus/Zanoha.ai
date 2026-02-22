import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";

export async function POST(req: Request) {
  try {
    console.log("🔄 Updating call status");

    const data = await req.json();
    const { callSid, status, duration, error } = data;

    console.log(`📊 Call ${callSid} → ${status}`);

    if (!callSid || !status) {
      return NextResponse.json({ error: "Missing callSid or status" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('call-logs');

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Add timestamps based on status
    if (status === "in-progress") {
      updateData.answeredAt = new Date();
    } else if (status === "completed") {
      updateData.completedAt = new Date();
      if (duration) updateData.duration = parseInt(duration);
    } else if (["failed", "busy", "no-answer", "canceled"].includes(status)) {
      updateData.completedAt = new Date();
      if (error) updateData.error = error;
    }

    const result = await collection.updateOne(
      { callSid },
      { $set: updateData }
    );

    console.log(`✅ Updated call status for ${callSid}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error updating call status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}