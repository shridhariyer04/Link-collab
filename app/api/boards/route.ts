import { db } from "@/lib/db";
import { boardMembers, boards, users } from "@/lib/db/schemas";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";


export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Fetch boards where the user is a member
        const userBoards = await db
            .select({
                id: boards.id,
                name: boards.name,
                createdBy: boards.createdBy,
                createdAt: boards.createdAt,
            })
            .from(boards)
            .innerJoin(boardMembers, eq(boards.id, boardMembers.boardId))
            .where(eq(boardMembers.userId, userId));


           
        return NextResponse.json({ boards: userBoards });
    } catch (error) {
        console.error('Error fetching boards:', error);
        return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { name } = await req.json();
        const boardId = uuidv4();
        
        // Call clerkClient() to get the actual client instance
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);

        // Insert user if they don't exist
        await db.insert(users).values({
            id: clerkUser.id,
            name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim(),
            email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
            avatar: clerkUser.imageUrl,
        }).onConflictDoNothing();

        // Create the board
        await db.insert(boards).values({
            id: boardId,
            name,
            createdBy: userId
        });

        // Add the creator as owner
        await db.insert(boardMembers).values({
            boardId,
            userId,
            role: "owner"
        });

        return NextResponse.json({ boardId });
    } catch (error) {
        console.error('Error creating board:', error);
        return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
    }
}