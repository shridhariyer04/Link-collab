import { db } from "@/lib/db";
import { boardMembers, boards } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {v4 as uuidv4} from "uuid"


export async function POST(req:Request){
    const {userId} = await auth();
    if(!userId) return NextResponse.json({error:"Unauthorized"},{status:401})

        const {name} = await req.json();
        const boardId = uuidv4();

        await db.insert(boards).values({
            id:boardId,
            name,
            createdBy:userId
        })

        await db.insert(boardMembers).values({
            boardId,
            userId,
            role:"owner"
        })

        return NextResponse.json({boardId})

}