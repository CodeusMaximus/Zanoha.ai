import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";

export async function POST(req: Request) {
  try {
    const { callSid, conversationLog, qualification } = await req.json();

    console.log(`💬 Saving conversation for ${callSid}`);
    console.log(`📋 Qualification:`, qualification);

    const { db } = await connectToDatabase();
    const collection = db.collection('call-logs');

    const updateData: any = {
      conversationLog: conversationLog || [],
      qualification: qualification || {},
      updatedAt: new Date()
    };

    // ✅ If appointment was booked, add special fields
    if (qualification?.appointmentBooked) {
      updateData.appointmentBooked = true;
      updateData.appointmentDetails = qualification.appointmentDetails || "";
      console.log(`🎯 APPOINTMENT LOGGED: ${qualification.appointmentDetails}`);
    }

    await collection.updateOne(
      { callSid },
      { $set: updateData }
    );

    console.log(`✅ Conversation saved for ${callSid}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error saving conversation:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}