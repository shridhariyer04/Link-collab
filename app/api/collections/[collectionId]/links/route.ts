import { db } from "@/lib/db";
import { boardMembers, collections, links } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { error } from "console";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4} from "uuid";

export async function POST(req:Request,{params}:{params:{collectionId:string}}){
    const {userId} = await auth();
    if(!userId) return NextResponse.json({error:"Unauthroized"},{status:401});

    const {url, title, description,favicon,tags} = await req.json();

    //Get the bpardId assoicated wuth this collection

    const collection = await db.query.collections.findFirst({
        where:(c,{eq}) =>eq(c.id,params.collectionId),
    })

    if(!collection) return NextResponse.json({error:"Collection not found"},{status:404})
        
        const isMember = await db.query.boardMembers.findFirst({
            where:(m,{eq, and}) =>
                and(eq(m.boardId, collection.boardId), eq(m.userId, userId)),
        })

        if(!isMember) return NextResponse.json({error:"Forbidden"},{status:403})

            const id = uuidv4();

            await db.insert(links).values({
                id,
                url,
                title,
                description,
                favicon,
                tags,
                collectionId:params.collectionId,
            })
            return NextResponse.json({linkId:id})
        }
