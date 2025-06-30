import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { boardMembers, collections } from "@/lib/db/schemas";

export async function POST(req: Request, { params }: { params: { boardId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const isMember = await db.query.boardMembers.findFirst({
    where: (m, { eq, and }) => and(eq(m.boardId, params.boardId), eq(m.userId, userId)),
  });

  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await db.insert(collections).values({
    name,
    boardId: params.boardId,
    createdBy: userId,
  }).returning({ id: collections.id });

  return NextResponse.json({ collectionId: result[0].id });
}
