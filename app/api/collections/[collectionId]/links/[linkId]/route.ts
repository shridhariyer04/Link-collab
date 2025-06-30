import { db } from "@/lib/db";
import { boardMembers, collections, links } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { collectionId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const collection = await db.query.collections.findFirst({
    where: (c, { eq }) => eq(c.id, params.collectionId),
  });

  if (!collection) return NextResponse.json({ error: "Collection not found" }, { status: 404 });

  const isMember = await db.query.boardMembers.findFirst({
    where: (m, { eq, and }) =>
      and(eq(m.boardId, collection.boardId), eq(m.userId, userId)),
  });

  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const results = await db.query.links.findMany({
    where: (l, { eq }) => eq(l.collectionId, params.collectionId),
  });

  return NextResponse.json({ links: results });
}

export async function DELETE(_:Request,{params}:{params:{collectionId:string,linkId:string}}) {
    const {userId} = await auth();

    if(!userId){
        return NextResponse.json({error:"Unauthorized"},{status:401})
    }

    const collection = await db.query.collections.findFirst({
        where:(c,{eq}) =>eq(c.id,params.collectionId)
    })

    const isEditor = await db.query.boardMembers.findFirst({
        where:(m,{eq,and}) =>
            and(eq(m.boardId,collections.boardId),eq(m.userId,userId))
    })

    if(!isEditor){
        return NextResponse.json({error:"Forbidden"},{status:403})
    }

    await db.delete(links).where(eq(links.id,params.linkId));

    return NextResponse.json({success:true});
}