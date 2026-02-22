import twilio from "twilio";
import { getDb } from "./mongodb";

export function getMasterTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  if (!sid || !token) throw new Error("Missing Twilio env vars");
  return twilio(sid, token);
}

export async function getOrCreateTenantSubaccount(businessId: string) {
  const db = await getDb();
  const col = db.collection("business_twilio");

  const existing = await col.findOne({ businessId });
  if (existing?.twilioSubaccountSid) return existing.twilioSubaccountSid as string;

  const master = getMasterTwilioClient();
  const friendlyName = `biz_${businessId}`.slice(0, 64);

  const sub = await master.api.accounts.create({ friendlyName });

  await col.updateOne(
    { businessId },
    {
      $set: {
        businessId,
        twilioSubaccountSid: sub.sid,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return sub.sid;
}

// Returns a client scoped to the subaccount
export function getTenantTwilioClient(subaccountSid: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const master = twilio(sid, token);
  return master.api.accounts(subaccountSid);
}
