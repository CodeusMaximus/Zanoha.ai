import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getOrCreateBusiness } from "@/lib/business";
import twilio from "twilio";

export const runtime = "nodejs";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

export async function POST(req: NextRequest) {
  try {
    const biz = await getOrCreateBusiness();
    const db = await getDb();

    const now = new Date();

    // Get all upcoming appointments
    const appointments = await db
      .collection("appointments")
      .find({
        businessId: biz._id.toString(),
        startISO: { $gte: now.toISOString() },
      })
      .toArray();

    if (!accountSid || !authToken || !twilioPhone) {
      return NextResponse.json(
        { success: false, error: "Missing Twilio credentials" },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);
    const results = [];

    for (const appt of appointments) {
      if (!appt.customerPhone && !appt.phone) {
        results.push({ id: appt._id.toString(), status: "skipped", reason: "no phone" });
        continue;
      }

      try {
        const phone = appt.customerPhone || appt.phone;
        const apptDate = new Date(appt.startISO);
        const formattedTime = apptDate.toLocaleString();

        const twimlUrl =
          `${process.env.NEXTJS_PUBLIC_URL || "http://localhost:3000"}/api/twilio/reminder?` +
          `customerName=${encodeURIComponent(appt.customerName || "there")}&` +
          `appointmentTime=${encodeURIComponent(formattedTime)}&` +
          `service=${encodeURIComponent(appt.service || "appointment")}`;

        const call = await client.calls.create({
          to: phone,
          from: twilioPhone,
          url: twimlUrl,
        });

        results.push({ id: appt._id.toString(), status: "success", callSid: call.sid });
        
        // Small delay between calls
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err: any) {
        results.push({ id: appt._id.toString(), status: "failed", error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      total: appointments.length,
      results,
    });
  } catch (err: any) {
    console.error("❌ Remind all error:", err);
    return NextResponse.json(
      { success: false, error: err?.message },
      { status: 500 }
    );
  }
}