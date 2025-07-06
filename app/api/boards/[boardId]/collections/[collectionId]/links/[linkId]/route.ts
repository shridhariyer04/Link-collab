// app/api/boards/[boardId]/collections/[collectionId]/links/[linkId]/route.ts

import { db } from "@/lib/db";
import { links } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireBoardAccess } from "@/lib/permission";

// Updated for Next.js 15 - params is now a Promise
export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{
      boardId: string;
      collectionId: string;
      linkId: string;
    }>;
  }
) {
  // Await the params Promise
  const { boardId, collectionId, linkId } = await context.params;

  const access = await requireBoardAccess(boardId);
  if (access instanceof NextResponse) {
    return access;
  }

  const { userId } = access;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.delete(links).where(eq(links.id, linkId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting link:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}