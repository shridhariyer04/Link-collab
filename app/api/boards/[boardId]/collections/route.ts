import { db } from "@/lib/db";
import { collections, users } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireBoardAccess } from "@/lib/permission";
import { ActivityLogger } from "@/lib/activity-logger";
ActivityLogger


export async function GET(
  req: Request,
  context: { params: Promise<{ boardId: string }> }
) {
  // Await params before accessing properties
  const params = await context.params;
  const boardId = params.boardId;
  
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

export async function POST(
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

  const { userId, role } = access; 
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.query.users.findFirst({
  where: eq(users.id, userId)
});
const username = user?.name ?? userId; // fallback to userId


  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const collectionId = uuidv4();

  try {
    await db.insert(collections).values({
      id: collectionId,
      name,
      boardId: boardId,
      createdBy: userId
    });

    await ActivityLogger.log({
  boardId,
  collectionId,
  userId,
  action: "deleted_collection",
  message: `${username} deleted collection "${collections?.name ?? "Unnamed"}"`
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