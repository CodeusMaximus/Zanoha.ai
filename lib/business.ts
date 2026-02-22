import { getDb } from "../lib/mongodb";

export async function getOrCreateBusiness() {
  const db = await getDb();
  const businesses = db.collection("businesses");

  let biz = await businesses.findOne({});
  if (!biz) {
    const doc = {
      name: "Fresh Fade Barbershop",
      timezone: process.env.GOOGLE_TIMEZONE || "America/New_York",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await businesses.insertOne(doc);
    biz = await businesses.findOne({ _id: res.insertedId });
  }
  return biz!;
}
