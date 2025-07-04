import { db } from "@/lib/db";
import { boards, boardMembers } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// ──────────────── GET Board (Check membership) ────────────────
export async function GET(
  _: NextRequest,
  context: { params: { boardId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boardId = context.params.boardId;

  const board = await db
    .select()
    .from(boards)
    .innerJoin(boardMembers, eq(boards.id, boardMembers.boardId))
    .where(and(eq(boards.id, boardId), eq(boardMembers.userId, userId)))
    .limit(1);

  if (!board.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ board: board[0] });
}

// ──────────────── PATCH Board (Update Name) ────────────────
export async function PATCH(
  req: NextRequest,
  context: { params: { boardId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boardId = context.params.boardId;
  const { name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const member = await db.query.boardMembers.findFirst({
    where: (bm, { eq, and }) => and(eq(bm.boardId, boardId), eq(bm.userId, userId)),
  });

  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.update(boards).set({ name }).where(eq(boards.id, boardId));

  return NextResponse.json({ success: true });
}

// ──────────────── DELETE Board ────────────────
export async function DELETE(
  _: NextRequest,
  context: { params: { boardId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boardId = context.params.boardId;

  const member = await db.query.boardMembers.findFirst({
    where: (bm, { eq, and }) => and(eq(bm.boardId, boardId), eq(bm.userId, userId)),
  });

  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden - not owner" }, { status: 403 });
  }

  await db.delete(boards).where(eq(boards.id, boardId));

  return NextResponse.json({ success: true });
}
