// app/api/onboard-user/route.ts
import { db } from "@/lib/db";
import { boardMembers, pendingInvites, users } from "@/lib/db/schemas";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🧑 Onboarding user:", userId);

    // Get user info from Clerk
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    
    if (!clerkUser || !clerkUser.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json(
        { error: "User not found or missing email" },
        { status: 400 }
      );
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;
    const userName = clerkUser.firstName || clerkUser.username || "Unknown User";
    const userAvatar = clerkUser.imageUrl || null;

    console.log("📧 User email:", userEmail);

    // Check if user exists in our database
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    let userWasCreated = false;

    // If user doesn't exist, create them
    if (!user) {
      console.log("👤 Creating new user in database");
      
      try {
        await db.insert(users).values({
          id: userId,
          email: userEmail,
          name: userName,
          avatar: userAvatar,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        userWasCreated = true;

        // Fetch the newly created user
        user = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        console.log("✅ User created successfully:", user);
      } catch (insertError) {
        console.error("❌ Error creating user:", insertError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    } else {
      console.log("👤 User already exists in database");
      
      // Update user info if needed (keeps user data fresh)
      const needsUpdate = 
        user.email !== userEmail || 
        user.name !== userName || 
        user.avatar !== userAvatar;

      if (needsUpdate) {
        console.log("🔄 Updating user information");
        try {
          await db.update(users)
            .set({
              email: userEmail,
              name: userName,
              avatar: userAvatar,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
        } catch (updateError) {
          console.error("❌ Error updating user:", updateError);
          // Continue anyway, this is not critical
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Failed to retrieve user after creation" },
        { status: 500 }
      );
    }

    // Check if there's a pending invite for this email
    const invite = await db.query.pendingInvites.findFirst({
      where: eq(pendingInvites.email, userEmail),
    });

    if (!invite) {
      console.log("📭 No pending invitation found for this email");
      return NextResponse.json({
        onboard: true,
        message: "User onboarded successfully",
        userCreated: userWasCreated,
        hasInvite: false,
      });
    }

    console.log("📨 Pending invite found:", invite);

    // Check if already a member of this board
    const existingMember = await db.query.boardMembers.findFirst({
      where: and(
        eq(boardMembers.boardId, invite.boardId),
        eq(boardMembers.userId, userId)
      ),
    });

    if (existingMember) {
      console.log("👥 User already a member of this board");
      
      // Remove the pending invite since they're already a member
      try {
        await db.delete(pendingInvites).where(eq(pendingInvites.id, invite.id));
        console.log("🗑️ Cleaned up pending invite");
      } catch (deleteError) {
        console.error("❌ Error deleting pending invite:", deleteError);
        // Continue anyway
      }

      return NextResponse.json({
        onboard: true,
        message: "User already part of the board",
        userCreated: userWasCreated,
        hasInvite: true,
        boardId: invite.boardId,
      });
    }

    // Add user to board members
    try {
      await db.insert(boardMembers).values({
        boardId: invite.boardId,
        userId,
        role: invite.role as "owner" | "editor" | "viewer",
      });

      console.log("✅ Added to board:", invite.boardId);
    } catch (insertError) {
      console.error("❌ Error adding user to board:", insertError);
      return NextResponse.json(
        { error: "Failed to add user to board" },
        { status: 500 }
      );
    }

    // Delete the pending invite
    try {
      await db.delete(pendingInvites).where(eq(pendingInvites.id, invite.id));
      console.log("🗑️ Pending invite deleted");
    } catch (deleteError) {
      console.error("❌ Error deleting pending invite:", deleteError);
      // This is not critical, continue
    }

    return NextResponse.json({
      onboard: true,
      message: "Successfully onboarded to the board",
      boardId: invite.boardId,
      userCreated: userWasCreated,
      hasInvite: true,
    });

  } catch (error) {
    console.error("❌ Error in onboard-user route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}