import { db } from "@/lib/db";
import { collections } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET(_: Request, { params }: { params: Promise<{ boardId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Await params before using
  const { boardId } = await params;

  try {
    const result = await db
      .select()
      .from(collections)
      .where(eq(collections.boardId, boardId));

    return NextResponse.json({ collections: result });
  } catch (err) {
    console.error("Error fetching collections:", err);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Await params before using
  const { boardId } = await params;

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const collectionId = uuidv4();

  try {
    // Remove createdBy field since it doesn't exist in the schema
    await db.insert(collections).values({
      id: collectionId,
      name,
      boardId: boardId,
      createdBy:userId
      // Remove createdBy: userId, since column doesn't exist
    });

    return NextResponse.json({ 
      collection: { 
        id: collectionId, 
        name, 
        boardId: boardId 
      } 
    });
  } catch (err) {
    console.error("Error creating collection:", err);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}