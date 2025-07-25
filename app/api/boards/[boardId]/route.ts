import { db } from "@/lib/db";
import { boards, boardMembers, users } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireBoardAccess } from "@/lib/permission";
import { ActivityLogger } from "@/lib/activity-logger";


// ──────────────── GET Board (Check membership) ────────────────
export async function GET(
  _: NextRequest,
  context: { params: Promise<{ boardId: string }> }
) {
  // Await params before accessing properties
  const params = await context.params;
  const boardId = params.boardId;
  
  const access = await requireBoardAccess(boardId);

  if (access instanceof NextResponse) {
    return access; // early return if unauthorized
  }

  const { userId, role } = access; // now safe to destructure

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  context: { params: Promise<{ boardId: string }> }
) {
  // Await params before accessing properties
  const params = await context.params;
  const boardId = params.boardId;
  
  const access = await requireBoardAccess(boardId);

  if (access instanceof NextResponse) {
    return access; // early return if unauthorized
  }

  const { userId, role } = access; // now safe to destructure

      const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
     });
      const username = user?.name ?? userId;

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const member = await db.query.boardMembers.findFirst({
    where: (bm, { eq, and }) => and(eq(bm.boardId, boardId), eq(bm.userId, userId)),
  });

  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ActivityLogger.log({
  boardId,
  userId,
  action: "deleted_collection",
  message: `${username} updated board }"`
});

  await db.update(boards).set({ name }).where(eq(boards.id, boardId));

  return NextResponse.json({ success: true });
}

// ──────────────── DELETE Board ────────────────
export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ boardId: string }> }
) {
  // Await params before accessing properties
  const params = await context.params;
  const boardId = params.boardId;
  
  const access = await requireBoardAccess(boardId);

  if (access instanceof NextResponse) {
    return access; // early return if unauthorized
  }

    const { userId, role } = access; // now safe to destructure
  
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
        const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
       });
        const username = user?.name ?? userId;

await ActivityLogger.log({
  boardId,
  userId,
  action: "deleted_collection",
  message: `${username} deleted collection }"`
});        

  const member = await db.query.boardMembers.findFirst({
    where: (bm, { eq, and }) => and(eq(bm.boardId, boardId), eq(bm.userId, userId)),
  });

  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden - not owner" }, { status: 403 });
  }

  await db.delete(boards).where(eq(boards.id, boardId));

  return NextResponse.json({ success: true });
}