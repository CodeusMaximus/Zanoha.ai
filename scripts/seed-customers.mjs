import "dotenv/config";
import { MongoClient } from "mongodb";

const URI = process.env.DATABASE_URI || process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "receptionist_crm_demo";

if (!URI) {
  console.error("❌ Missing DATABASE_URI (or MONGODB_URI) in .env.local");
  process.exit(1);
}

const businessesCol = "businesses";
const customersCol = "customers";

// Small helper to generate realistic-ish US phone numbers
function randomPhone() {
  const area = ["347", "718", "917", "929", "646"][Math.floor(Math.random() * 5)];
  const mid = String(Math.floor(200 + Math.random() * 800));
  const last = String(Math.floor(1000 + Math.random() * 9000));
  return `${area}${mid}${last}`; // e.g. 3475551234
}

function slugEmail(name, idx) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.)|(\.$)/g, "");
  return `${base}.${idx}@demo-mail.com`;
}

const firstNames = [
  "Ava","Mia","Noah","Liam","Sophia","Olivia","Elijah","Amir","Jayden","Zoe",
  "Isabella","Ethan","Mason","Lucas","Chloe","Nia","Camila","Aiden","Levi","Layla"
];

const lastNames = [
  "Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez",
  "Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee"
];

function makeCustomer(i) {
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${fn} ${ln}`;
  return {
    name,
    email: slugEmail(name, i + 1),
    phone: randomPhone(),
    isReturning: Math.random() < 0.45,
    notes: Math.random() < 0.2 ? "Prefers afternoon slots" : "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function main() {
  const client = new MongoClient(URI);
  await client.connect();
  console.log("✅ Connected to MongoDB");

  const db = client.db(DB_NAME);

  // Ensure there is at least one business to attach customers to
  let biz = await db.collection(businessesCol).findOne({});
  if (!biz) {
    const name = process.env.DEFAULT_BUSINESS_NAME || "Fresh Fade Barbershop";
    const timezone = process.env.DEFAULT_BUSINESS_TZ || "America/New_York";
    const insertBiz = await db.collection(businessesCol).insertOne({
      name,
      timezone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    biz = { _id: insertBiz.insertedId, name, timezone };
    console.log("🏪 Created business:", biz.name, String(biz._id));
  } else {
    console.log("🏪 Using business:", biz.name, String(biz._id));
  }

  const COUNT = Number(process.env.SEED_CUSTOMERS_COUNT || 50);

  const customers = Array.from({ length: COUNT }).map((_, i) => ({
    ...makeCustomer(i),
    businessId: String(biz._id), // match your existing pattern (string businessId)
  }));

  // Avoid duplicates by email if you run it multiple times:
  // - insert one by one with upsert
  let upserts = 0;
  for (const c of customers) {
    const res = await db.collection(customersCol).updateOne(
      { businessId: c.businessId, email: c.email },
      { $setOnInsert: c },
      { upsert: true }
    );
    if (res.upsertedCount) upserts += 1;
  }

  console.log(`✅ Seed complete. Requested: ${COUNT}, Inserted new: ${upserts}`);
  await client.close();
  console.log("👋 Done");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
