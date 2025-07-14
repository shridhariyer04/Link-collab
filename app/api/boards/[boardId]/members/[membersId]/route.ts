// app/api/boards/[boardId]/members/[memberId]/route.ts
import { db } from "@/lib/db";
import { boardMembers } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { boardId: string; memberId: string } }
) {
  try {
    const { userId } = await auth();
    const { boardId, memberId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    if (!boardId || !memberId) {
      return NextResponse.json(
        { error: "Board ID and Member ID are required" }, 
        { status: 400 }
      );
    }

    // Check if requester is a member of the board
    const requester = await db.query.boardMembers.findFirst({
      where: and(
        eq(boardMembers.boardId, boardId), 
        eq(boardMembers.userId, userId)
      ),
    });

    if (!requester) {
      return NextResponse.json(
        { error: "You are not a member of this board" }, 
        { status: 403 }
      );
    }

    // Check if requester is owner
    if (requester.role !== "owner") {
      return NextResponse.json(
        { error: "Only board owners can remove members" }, 
        { status: 403 }
      );
    }

    // Prevent owner from removing themselves
    if (memberId === userId) {
      return NextResponse.json(
        { error: "Board owners cannot remove themselves" }, 
        { status: 400 }
      );
    }

    // Check if the member to be deleted exists
    const memberToDelete = await db.query.boardMembers.findFirst({
      where: and(
        eq(boardMembers.boardId, boardId), 
        eq(boardMembers.userId, memberId)
      ),
    });

    if (!memberToDelete) {
      return NextResponse.json(
        { error: "Member not found in this board" }, 
        { status: 404 }
      );
    }

    // Prevent removing another owner (if you have multiple owners)
    if (memberToDelete.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove another board owner" }, 
        { status: 400 }
      );
    }

    // Delete the member
    const result = await db.delete(boardMembers).where(
      and(
        eq(boardMembers.boardId, boardId), 
        eq(boardMembers.userId, memberId)
      )
    );

    console.log('Member removed:', {
      boardId,
      removedMemberId: memberId,
      removedBy: userId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      message: "Member removed successfully" 
    });

  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}