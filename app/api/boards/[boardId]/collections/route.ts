import { db } from "@/lib/db";
import { collections } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireBoardAccess } from "@/lib/permission";

export async function GET(req: Request,context:{params:{boardId:string}}) {
  const boardId = context.params.boardId;
 const access = await requireBoardAccess(boardId);

if (access instanceof NextResponse) {
  return access; // early return if unauthorized
}

const { userId, role } = access; 
   if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 
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

export async function POST(req: NextRequest, context:{params:{boardId:string} }) {
 const boardId = context.params.boardId;
 const access = await requireBoardAccess(boardId);

if (access instanceof NextResponse) {
  return access; // early return if unauthorized
}

const { userId, role } = access; 
   if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 

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