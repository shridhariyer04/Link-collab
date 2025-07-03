import { db } from "@/lib/db";
import { links } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

// DELETE /api/boards/:boardId/collections/:collectionId/links/:linkId
// DELETE /api/boards/:boardId/collections/:collectionId/links/:linkId
// DELETE from inside links/route.ts
export async function DELETE(req: Request, { params }: { params: { collectionId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const linkId = searchParams.get("linkId");
  if (!linkId) return NextResponse.json({ error: "Missing linkId" }, { status: 400 });

  try {
    await db.delete(links).where(eq(links.id, linkId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting link:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
