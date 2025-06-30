import { db } from "@/lib/db";
import { links } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { collectionId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url, title, description, favicon } = await req.json();

  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

  await db.insert(links).values({
    url,
    title,
    description,
    favicon,
    collectionId: params.collectionId,
    createdBy: userId,
  });

  return NextResponse.json({ success: true });
}

export async function GET(_: Request, { params }: { params: { collectionId: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.query.links.findMany({
    where: (l, { eq }) => eq(l.collectionId, params.collectionId),
  });

  return NextResponse.json({ links: result });
}
