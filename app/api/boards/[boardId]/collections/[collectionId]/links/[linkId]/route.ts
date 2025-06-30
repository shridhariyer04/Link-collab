import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { links } from "@/lib/db/schemas";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
NextResponse

export async function DELETE(_: Request, { params }: { params: { collectionId: string, linkId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(links).where(eq(links.id, params.linkId));

  return NextResponse.json({ success: true });
}
