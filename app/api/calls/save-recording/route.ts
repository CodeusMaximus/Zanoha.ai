import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";

export async function POST(req: Request) {
  try {
    console.log("🔄 Saving call recording");

    const data = await req.json();
    const { callSid, recordingSid, recordingUrl, recordingDuration } = data;

    console.log(`🎙️ Recording for ${callSid}: ${recordingSid}`);

    if (!callSid) {
      return NextResponse.json({ error: "Missing callSid" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('call-logs');

    const updateData: any = {
      recordingSid,
      recordingUrl,
      recordingDuration: recordingDuration ? parseInt(recordingDuration) : null,
      transcriptionStatus: "pending",
      updatedAt: new Date()
    };

    const result = await collection.updateOne(
      { callSid },
      { $set: updateData }
    );

    console.log(`✅ Recording saved for ${callSid}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error saving recording:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}