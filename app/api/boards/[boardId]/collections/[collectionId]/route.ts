// app/api/boards/[boardId]/collections/[collectionId]/route.ts
import { db } from "@/lib/db";
import { collections, users } from "@/lib/db/schemas";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { requireBoardAccess } from "@/lib/permission";
import { ActivityLogger } from "@/lib/activity-logger";
import { clerkClient } from "@clerk/nextjs/server";


export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ boardId: string; collectionId: string }> }
) {
  try {
    const { boardId, collectionId } = await params;
    
    const access = await requireBoardAccess(boardId);
    if (access instanceof NextResponse) {
      return access;
    }

    const collection = await db.query.collections.findFirst({
      where: and(eq(collections.id, collectionId), eq(collections.boardId, boardId)),
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string; collectionId: string }> }
) {
  try {
    const { boardId, collectionId } = await params;
    
    const access = await requireBoardAccess(boardId);
    if (access instanceof NextResponse) {
      return access;
    }

    const {userId, role } = access;
    if (role !== "owner" && role !== "editor") {
      return NextResponse.json({ error: "Forbidden: Only owners or editors can update collections" }, { status: 403 });
    }

    const { name } = await req.json();

    
    const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
     });
      const username = user?.name ?? userId; // fallback to userId



    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Invalid or missing collection name" }, { status: 400 });
    }

    const [updatedCollection] = await db
      .update(collections)
      .set({ name })
      .where(and(eq(collections.id, collectionId), eq(collections.boardId, boardId)))
      .returning();

    if (!updatedCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
    await ActivityLogger.log({
  boardId,
  collectionId,
  userId,
  action: "updated_collection",
  message: `${username} renamed collection to "${updatedCollection.name}"`
});

    return NextResponse.json({ collection: updatedCollection });
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ boardId: string; collectionId: string }> }
) {
  try {
    const { boardId, collectionId } = await params;
    
    const access = await requireBoardAccess(boardId);
    if (access instanceof NextResponse) {
      return access;
    }

    const {userId, role } = access;
    if (role !== "owner" && role !== "editor") {
      return NextResponse.json({ error: "Forbidden: Only owners or editors can delete collections" }, { status: 403 });
    }
    
    const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
     });
        const username = user?.name ?? userId; // fallback to userId


    const [deletedCollection] = await db
      .delete(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.boardId, boardId)))
      .returning();

    if (!deletedCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

   await ActivityLogger.log({
  boardId,
  collectionId,
  userId,
  action: "deleted_collection",
  message: `${username} deleted collection "${deletedCollection?.name ?? "Unnamed"}"`
});


    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}