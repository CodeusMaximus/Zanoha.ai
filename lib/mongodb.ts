// src/lib/mongodb.ts
import { MongoClient, ObjectId } from "mongodb";

const URI_ENV = process.env.DATABASE_URI || process.env.MONGODB_URI;
if (!URI_ENV) {
  console.error("❌ Missing DATABASE_URI (or MONGODB_URI) environment variable");
  throw new Error("Please add DATABASE_URI to .env.local");
}

const uri = URI_ENV;

// Log redacted URI (dev only)
if (process.env.NODE_ENV === "development") {
  try {
    console.log(
      "🔄 MongoDB URI (redacted):",
      uri.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, "mongodb$1://$2:****@")
    );
  } catch {
    console.log("🔄 MongoDB URI loaded.");
  }
}

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    console.log("🔄 Creating new MongoDB client (development)");
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect()
      .then((c) => {
        console.log("✅ MongoDB connected (development)");
        return c;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error (development):", err);
        throw err;
      });
  } else {
    console.log("ℹ️ Using existing MongoDB client (development)");
  }
  clientPromise = global._mongoClientPromise;
} else {
  console.log("🔄 Creating new MongoDB client (production)");
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then((c) => c)
    .catch((err) => {
      console.error("❌ MongoDB connection error (production):", err);
      throw err;
    });
}

export async function connectToDatabase() {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB || "receptionist_crm_demo";
  const db = client.db(dbName);

  // Optional ping (safe, but you can remove if you want max speed)
  if (process.env.NODE_ENV === "development") {
    await db.command({ ping: 1 });
    console.log("✅ Database ping successful");
  }

  return { client, db };
}

// Most App Router code wants just db:
export async function getDb() {
  const { db } = await connectToDatabase();
  return db;
}

// Helpers (same as your file)
export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

export function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
}

export { ObjectId };
export default clientPromise;
