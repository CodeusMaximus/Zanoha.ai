import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";

const DB_NAME = process.env.DATABASE_URI?? "receptionist-CRM";
const TASKS_COLLECTION = "tasks";

export async function GET(_req: NextRequest) {
  const { db } = await connectToDatabase();

  const docs = await db
    .collection(TASKS_COLLECTION)
    .find({})
    .sort({ date: 1 })
    .toArray();

  const tasks = docs.map((doc: any) => ({
    id: doc._id.toString(),
    title: doc.title,
    status: doc.status as "todo" | "in-progress" | "done",
    date: doc.date, // ISO string in DB
    // ✅ Include calendar booking metadata
    meetLink: doc.meetLink,
    calendarEventId: doc.calendarEventId,
    attendeeEmail: doc.attendeeEmail,
  }));

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, status = "todo", date } = body as {
    title?: string;
    status?: "todo" | "in-progress" | "done";
    date?: string;
  };

  if (!title || !date) {
    return NextResponse.json(
      { error: "Missing title or date" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();

  const doc = {
    title,
    status,
    date, // ISO string
    createdAt: new Date(),
  };

  const result = await db.collection(TASKS_COLLECTION).insertOne(doc);

  return NextResponse.json(
    {
      task: {
        id: result.insertedId.toString(),
        title,
        status,
        date,
      },
    },
    { status: 201 }
  );
}