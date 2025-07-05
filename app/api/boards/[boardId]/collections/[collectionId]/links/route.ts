import { db } from "@/lib/db";
import { links } from "@/lib/db/schemas";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { requireBoardAccess } from "@/lib/permission";

// Explicit type for context
type Context = {
  params: Promise<{
    boardId: string;
    collectionId: string;
  }>;
};

// GET /api/boards/:boardId/collections/:collectionId/links
export async function GET(_: NextRequest, context: Context) {
  const { boardId, collectionId } = await context.params;
  
  const access = await requireBoardAccess(boardId);
  if (access instanceof NextResponse) {
    return access; // early return if unauthorized
  }

  const { userId, role } = access; // now safe to destructure

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await db.query.links.findMany({
      where: (l, { eq }) => eq(l.collectionId, collectionId),
    });

    return NextResponse.json({ links: result });
  } catch (err) {
    console.error("Error fetching links:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/boards/:boardId/collections/:collectionId/links
export async function POST(req: NextRequest, context: Context) {
  const { boardId, collectionId } = await context.params;
  
  const access = await requireBoardAccess(boardId);
  if (access instanceof NextResponse) {
    return access; // early return if unauthorized
  }

  const { userId, role } = access; // now safe to destructure

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

  try {
    await db.insert(links).values({
      id: uuidv4(),
      url,
      collectionId,
      createdBy: userId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error adding link:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/boards/:boardId/collections/:collectionId/links?linkId=...
export async function DELETE(req: NextRequest, context: Context) {
  const { boardId, collectionId } = await context.params;
  
  const access = await requireBoardAccess(boardId);
  if (access instanceof NextResponse) {
    return access; // early return if unauthorized
  }

  const { userId, role } = access; // now safe to destructure

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const linkId = searchParams.get("linkId");
  if (!linkId) return NextResponse.json({ error: "Missing linkId" }, { status: 400 });

  try {
    await db.delete(links).where(eq(links.id, linkId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting link:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}