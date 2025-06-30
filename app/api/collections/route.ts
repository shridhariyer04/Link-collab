import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collections, boardMembers } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request, { params }: { params: { boardId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await db.query.boardMembers.findFirst({
    where: (m, { eq, and }) =>
      and(eq(m.boardId, params.boardId), eq(m.userId, userId)),
  });

  if (!member) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const { name } = await req.json();

  const id = uuidv4();

  await db.insert(collections).values({
    id,
    name,
    boardId: params.boardId,
  });

  return NextResponse.json({ collectionId: id });
}
