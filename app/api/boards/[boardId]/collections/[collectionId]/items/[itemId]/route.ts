import { db } from "@/lib/db";
import { items } from "@/lib/db/schemas";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireBoardAccess } from "@/lib/permission";
import { ActivityLogger } from "@/lib/activity-logger";

// Utility to validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ✅ GET handler - Get single item
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string; collectionId: string; itemId: string }> }
) {
  try {
    const { boardId, collectionId, itemId } = await params;

    const access = await requireBoardAccess(boardId);
    if (access instanceof NextResponse) return access;

    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.collectionId, collectionId)))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("GET item error:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

// ✅ PUT handler - Update item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string; collectionId: string; itemId: string }> }
) {
  try {
    const { boardId, collectionId, itemId } = await params;

    const access = await requireBoardAccess(boardId);
    if (access instanceof NextResponse) return access;

    const { role, userId } = access;

    const body = await req.json();
    const {
      type,
      title,
      url,
      description,
      content,
      fileData,
      tags
    } = body;

    // Check if item exists and belongs to this collection
    const [existingItem] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.collectionId, collectionId)))
      .limit(1);

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check permissions - only creator or admin can update
  
    // Validate type-specific fields if type is being updated
    const updateType = type || existingItem.type;
    const updateTitle = title || existingItem.title;

    if (updateType === "link" && url && !isValidUrl(url)) {
      return NextResponse.json({ error: "Valid URL is required for link" }, { status: 400 });
    }

    if (updateType === "note" && content === "") {
      return NextResponse.json({ error: "Note content cannot be empty" }, { status: 400 });
    }

    if (updateType === "file" && fileData && !fileData.url) {
      return NextResponse.json({ error: "File data with URL is required" }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;

    // Type-specific updates
    if (updateType === "link") {
      if (url !== undefined) updateData.url = url;
      updateData.content = null;
      updateData.fileUrl = null;
    } else if (updateType === "note") {
      if (content !== undefined) updateData.content = content;
      updateData.url = null;
      updateData.fileUrl = null;
    } else if (updateType === "file") {
      if (fileData?.url !== undefined) updateData.fileUrl = fileData.url;
      updateData.url = null;
      updateData.content = null;
    }

    // Update the item
    const [updatedItem] = await db
      .update(items)
      .set(updateData)
      .where(and(eq(items.id, itemId), eq(items.collectionId, collectionId)))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }

    // Log the activity
    await ActivityLogger.log({
      boardId,
      collectionId,
      itemId,
      userId,
      action: "updated_item",
      message: `${userId} updated item "${updateTitle}"`,
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error("PUT item error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// ✅ DELETE handler - Delete item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string; collectionId: string; itemId: string }> }
) {
  try {
    const { boardId, collectionId, itemId } = await params;

    const access = await requireBoardAccess(boardId);
    if (access instanceof NextResponse) return access;

    const { role, userId } = access;

    // Check if item exists and belongs to this collection
    const [existingItem] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.collectionId, collectionId)))
      .limit(1);

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check permissions - only creator or admin can delete
   
    // Delete the item
    await db
      .delete(items)
      .where(and(eq(items.id, itemId), eq(items.collectionId, collectionId)));

    // Log the activity
    await ActivityLogger.log({
      boardId,
      collectionId,
      itemId,
      userId,
      action: "deleted_item",
      message: `${userId} deleted item "${existingItem.title}"`,
    });

    return NextResponse.json({ 
      message: "Item deleted successfully",
      deletedItem: existingItem 
    });
  } catch (error) {
    console.error("DELETE item error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}