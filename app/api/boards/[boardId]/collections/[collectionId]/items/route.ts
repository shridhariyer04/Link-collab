import { ActivityLogger } from "@/lib/activity-logger";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schemas";
import { requireBoardAccess } from "@/lib/permission";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";


function isValid(url:string): boolean {
   try{
    new URL(url);
    return true;
   }
   catch{
    return false;
   }
}

export async function GET(
  req:NextRequest, {params}:{params:Promise<{boardId:string; collectionId:string}>}){
    try {
      const {boardId, collectionId} = await params;
      const access = await requireBoardAccess(boardId);

      if(access instanceof NextResponse) return access;

      const { searchParams } = new URL(req.url);
      const type = searchParams.get("type");

      const whereClause =  type?
      and(eq(items.collectionId, collectionId), eq(items.type, type))
      :eq(items.collectionId,collectionId)

      const result = await db.select().from(items).where(whereClause);

      return NextResponse.json({items:result});
    } catch (error) {
      console.error("Get Items error:",error);
      return NextResponse.json({error:"Failed to fetch items"},{status:500})
    }
  }


  //POST handler =  Create new item

  export async function POST(req: NextRequest, { params }: { params: Promise<{ boardId: string; collectionId: string }> }) {
  try {
    const { boardId, collectionId } = await params;

    const access = await requireBoardAccess(boardId);
    if (access instanceof NextResponse) return access;

    const { role, userId } = access;

    const body = await req.json();

    const { type, title, url, description, content, fileData, tags } = body;
    if (!type || !title) {
      return NextResponse.json({ error: "Type and title are required" }, { status: 400 });
    }

    if (type === "link" && (!url || !isValid(url))) {
      return NextResponse.json({ error: "Valid URL is required for link" }, { status: 400 });
    }

    if (type === "note" && !content) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }

    if (type === "file" && !fileData?.url) {
      return NextResponse.json({ error: "File data with URL is required" }, { status: 400 });
    }

    const itemData = {
      id: uuidv4(),
      type,
      title,
      description: description ?? null,
      url: type === "link" ? url : null,
      content: type === "note" ? content : null, // Fixed typo: "content" to "note"
      fileUrl: type === "file" ? fileData.url : null,
      tags: tags ?? [],
      createdBy: userId,
      collectionId,
      createdAt: new Date(),
    };

    await db.insert(items).values(itemData);

    await ActivityLogger.log({
      boardId,
      collectionId,
      itemId: itemData.id,
      userId,
      action: "created_item",
      message: `${userId} added item "${title}"`,
    });

    return NextResponse.json({ item: itemData }, { status: 201 });
  } catch (error) {
    console.error("POST items error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}