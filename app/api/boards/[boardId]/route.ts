import { db } from "@/lib/db";
import { boardMembers, boards } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(req:NextRequest, {params} :{params:{boardId:string}}){
    const { userId } = await auth();

    if(!userId){
        return NextResponse.json({error:"Unauthorized"},{status:401})
    }

    const isOwner = await db.query.boardMembers.findFirst({
        where:(m,{eq,and}) =>and(eq(m.boardId, params.boardId), eq(m.userId, userId), eq(m.role,"owner")),
    })

    if(!isOwner){
        return NextResponse.json({error:"Not allowed"},{status:403})
    }

    await db.delete(boards).where(eq(boards.id,params.boardId));

    return NextResponse.json({success:true})

}