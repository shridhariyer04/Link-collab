// app/api/boards/[boardId]/members/route.ts
import React from "react";
import { db } from "@/lib/db";
import { boardMembers, users, pendingInvites, boards } from "@/lib/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { InviteEmail } from "@/email/InviteEmail";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { userId } = await auth();
    const { boardId } = await params; // Await the params

    console.log('POST /api/boards/[boardId]/members - Request received:', {
      userId,
      boardId,
    });

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, role } = body;

    console.log('Request body:', { email, role });

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid or missing email" }, { status: 400 });
    }

    if (!role || !['editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Must be 'editor' or 'viewer'" }, { status: 400 });
    }

    // Check if requester is owner of the board
    const requester = await db.query.boardMembers.findFirst({
      where: and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)),
    });

    console.log('Requester check:', requester);

    if (!requester || requester.role !== "owner") {
      return NextResponse.json({ error: "Forbidden - Only board owners can invite members" }, { status: 403 });
    }

    // Get the board information
    const board = await db.query.boards.findFirst({
      where: eq(boards.id, boardId),
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    console.log('Board found:', board.name);

    // Check if user exists in users table
    const foundUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    console.log('User lookup result:', foundUser ? 'Found' : 'Not found');

    if (foundUser) {
      // User exists in the system
      if (foundUser.id === userId) {
        return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
      }

      // Check if user is already a member
      const alreadyMember = await db.query.boardMembers.findFirst({
        where: and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, foundUser.id)),
      });

      if (alreadyMember) {
        return NextResponse.json({ error: "User is already a member of this board" }, { status: 409 });
      }

      // Add user as board member
      await db.insert(boardMembers).values({
        boardId,
        userId: foundUser.id,
        role: role as "editor" | "viewer",
      });

      console.log('User added to board');

      // Send email notification
      try {
        await sendEmail({
          to: email,
          subject: `You've been added to the board "${board.name}"`,
          react: React.createElement(InviteEmail, { boardName: board.name }),
        });
        console.log('Email sent successfully');
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({ added: true, message: "User added successfully" });
    } else {
      // User doesn't exist - create pending invite
      console.log('Creating pending invite');

      // Check if there's already a pending invite
      const existingInvite = await db.query.pendingInvites.findFirst({
        where: and(eq(pendingInvites.boardId, boardId), eq(pendingInvites.email, email)),
      });

      if (existingInvite) {
        return NextResponse.json({ error: "Invitation already sent to this email" }, { status: 409 });
      }

      await db.insert(pendingInvites).values({
        boardId,
        email,
        role: role as "editor" | "viewer",
      });

      console.log('Pending invite created');

      // Send invitation email
      try {
        await sendEmail({
          to: email,
          subject: `You've been invited to the board "${board.name}"`,
          react: React.createElement(InviteEmail, { boardName: board.name }),
        });
        console.log('Invitation email sent successfully');
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({ invited: true, message: "Invitation sent successfully" });
    }
  } catch (error) {
    console.error('Error in POST /api/boards/[boardId]/members:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET method to retrieve board members
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { userId } = await auth();
    const { boardId } = await params; // Await the params

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this board
    const userAccess = await db.query.boardMembers.findFirst({
      where: and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)),
    });

    if (!userAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all board members
    const members = await db.query.boardMembers.findMany({
      where: eq(boardMembers.boardId, boardId),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error in GET /api/boards/[boardId]/members:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}