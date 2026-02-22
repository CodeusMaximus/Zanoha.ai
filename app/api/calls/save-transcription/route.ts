import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";

export async function POST(req: Request) {
  try {
    console.log("🔄 Saving transcription");

    const data = await req.json();
    const { callSid, transcription, transcriptionStatus } = data;

    console.log(`📝 Transcription for ${callSid}`);

    if (!callSid) {
      return NextResponse.json({ error: "Missing callSid" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('call-logs');

    const updateData: any = {
      transcription,
      transcriptionStatus: transcriptionStatus === "completed" ? "completed" : "failed",
      updatedAt: new Date()
    };

    const result = await collection.updateOne(
      { callSid },
      { $set: updateData }
    );

    console.log(`✅ Transcription saved for ${callSid}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error saving transcription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}