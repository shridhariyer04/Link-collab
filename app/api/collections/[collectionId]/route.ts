import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collections, boardMembers } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";

export async function DELETE(_: Request, { params }: { params: { boardId: string; collectionId: string } }) {
  const { userId } =  await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isEditor = await db.query.boardMembers.findFirst({
    where: (m, { eq, and }) =>
      and(eq(m.boardId, params.boardId), eq(m.userId, userId)),
  });

  if (!isEditor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(collections).where(eq(collections.id, params.collectionId));

  return NextResponse.json({ success: true });
}
