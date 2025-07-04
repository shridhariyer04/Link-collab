import { db } from "@/lib/db";
import { collections } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";

// ──────────────── GET Collection ────────────────
export async function GET(
  _: NextRequest,
  context: { params: { boardId: string; collectionId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, collectionId } = context.params;

  try {
    const result = await db.query.collections.findFirst({
      where: (c, { and, eq }) =>
        and(eq(c.id, collectionId), eq(c.boardId, boardId)),
    });

    return NextResponse.json({ collection: result });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ──────────────── PATCH Collection ────────────────
export async function PATCH(
  req: NextRequest,
  context: { params: { boardId: string; collectionId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, collectionId } = context.params;
  const { name } = await req.json();

  try {
    await db
      .update(collections)
      .set({ name })
      .where(and(eq(collections.id, collectionId), eq(collections.boardId, boardId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ──────────────── DELETE Collection ────────────────
export async function DELETE(
  _: NextRequest,
  context: { params: { boardId: string; collectionId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId, collectionId } = context.params;

  try {
    await db
      .delete(collections)
      .where(and(eq(collections.id, collectionId), eq(collections.boardId, boardId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
