// lib/permissions.ts
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { boardMembers } from "@/lib/db/schemas";
import { and, eq } from "drizzle-orm";

export async function requireBoardAccess(boardId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const member = await db.query.boardMembers.findFirst({
    where: (bm, { eq, and }) =>
      and(eq(bm.boardId, boardId), eq(bm.userId, userId)),
  });

  if (!member) throw new Error("Forbidden");

  return { userId, role: member.role };
}
