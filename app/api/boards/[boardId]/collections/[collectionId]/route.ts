import { db } from "@/lib/db";
import { collections } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: { boardId: string; collectionId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await db.query.collections.findFirst({
      where: (c, { and, eq }) =>
        and(eq(c.id, params.collectionId), eq(c.boardId, params.boardId)),
    });

    return NextResponse.json({ collection: result });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { boardId: string; collectionId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();

  try {
    await db
      .update(collections)
      .set({ name })
      .where(eq(collections.id, params.collectionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { boardId: string; collectionId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await db
      .delete(collections)
      .where(eq(collections.id, params.collectionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
