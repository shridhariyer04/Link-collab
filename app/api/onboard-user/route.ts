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
        console.log("✅ User created successfully");
      } catch (insertError) {
        console.error("❌ Error creating user:", insertError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    } else {
      console.log("👤 User already exists in database");
      
      // Update user info to keep data fresh
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
          console.log("✅ User info updated");
        } catch (updateError) {
          console.error("❌ Error updating user:", updateError);
          // Continue anyway, this is not critical
        }
      }
    }

    // Look for pending invites for this email
    const pendingInvite = await db.query.pendingInvites.findFirst({
      where: eq(pendingInvites.email, userEmail),
    });

    if (!pendingInvite) {
      console.log("📭 No pending invitation found for this email");
      return NextResponse.json({
        onboard: true,
        message: "User onboarded successfully",
        userCreated: userWasCreated,
        hasInvite: false,
      });
    }

    console.log("📨 Pending invite found:", pendingInvite);

    // Check if user is already a member of this board
    const existingMember = await db.query.boardMembers.findFirst({
      where: and(
        eq(boardMembers.boardId, pendingInvite.boardId),
        eq(boardMembers.userId, userId)
      ),
    });

    if (existingMember) {
      console.log("👥 User already a member of this board");
      
      // Clean up the pending invite
      try {
        await db.delete(pendingInvites).where(eq(pendingInvites.id, pendingInvite.id));
        console.log("🗑️ Cleaned up pending invite");
      } catch (deleteError) {
        console.error("❌ Error deleting pending invite:", deleteError);
      }

      return NextResponse.json({
        onboard: true,
        message: "User already part of the board",
        userCreated: userWasCreated,
        hasInvite: true,
        boardId: pendingInvite.boardId,
      });
    }

    // Add user to board members
    try {
      await db.insert(boardMembers).values({
        boardId: pendingInvite.boardId,
        userId,
        role: pendingInvite.role as "editor" | "viewer",
      });

      console.log("✅ User added to board:", pendingInvite.boardId);
    } catch (insertError) {
      console.error("❌ Error adding user to board:", insertError);
      return NextResponse.json(
        { error: "Failed to add user to board" },
        { status: 500 }
      );
    }

    // Delete the pending invite
    try {
      await db.delete(pendingInvites).where(eq(pendingInvites.id, pendingInvite.id));
      console.log("🗑️ Pending invite deleted successfully");
    } catch (deleteError) {
      console.error("❌ Error deleting pending invite:", deleteError);
      // This is not critical, continue
    }

    return NextResponse.json({
      onboard: true,
      message: "Successfully onboarded and added to board",
      boardId: pendingInvite.boardId,
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