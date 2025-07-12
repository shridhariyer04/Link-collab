import { db } from "@/lib/db";
import { activities } from "@/lib/db/schemas";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireBoardAccess } from "@/lib/permission";

// GET /api/boards/[boardId]/activities
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    // Properly await the params
    const resolvedParams = await params;
    const { boardId } = resolvedParams;

    // Debug logging
    console.log('Received boardId:', boardId);
    console.log('Params object:', resolvedParams);

    // Validate boardId
    if (!boardId || boardId === '[boardId]') {
      console.error('Invalid boardId received:', boardId);
      return NextResponse.json(
        { error: "Invalid board ID" }, 
        { status: 400 }
      );
    }

    // Check if user has access to this board
    const access = await requireBoardAccess(boardId);
    if (access instanceof NextResponse) return access;

    // Fetch activities for this board, ordered by most recent first
    const boardActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.boardId, boardId))
      .orderBy(desc(activities.createdAt))
      .limit(100); // Limit to last 100 activities

    console.log(`Found ${boardActivities.length} activities for board ${boardId}`);

    return NextResponse.json({ 
      activities: boardActivities,
      count: boardActivities.length 
    });
  } catch (error) {
    console.error("GET activities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" }, 
      { status: 500 }
    );
  }
}