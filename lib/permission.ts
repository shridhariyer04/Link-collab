// lib/permission.ts
import { db } from "@/lib/db";
import { boardMembers } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

export async function requireBoardAccess(boardId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await db.query.boardMembers.findFirst({
      where: and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)),
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this board" }, { status: 403 });
    }

    return { userId, role: member.role };
  } catch (error) {
    console.error("Error in requireBoardAccess:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}