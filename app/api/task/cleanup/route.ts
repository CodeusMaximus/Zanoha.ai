import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../lib/mongodb";

const TASKS_COLLECTION = "tasks";

export async function DELETE(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();

    // Delete ALL tasks
    const result = await db.collection(TASKS_COLLECTION).deleteMany({});

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} task(s)`
    });
  } catch (error: any) {
    console.error("Error deleting tasks:", error);
    return NextResponse.json(
      { error: "Failed to delete tasks", details: error.message },
      { status: 500 }
    );
  }
}