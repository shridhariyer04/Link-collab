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

    console.log("📧 User email:", userEmail);

    // Check if user exists in our database
    let user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // If user doesn't exist, create them
    if (!user) {
      console.log("👤 Creating new user in database");
      
      try {
        await db.insert(users).values({
          id: userId,
          email: userEmail,
          name: userName,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

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
      
      // Update user info if needed (optional - keeps user data fresh)
      if (user.email !== userEmail || user.name !== userName) {
        console.log("🔄 Updating user information");
        await db.update(users)
          .set({
            email: userEmail,
            name: userName,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Failed to retrieve user after creation" },
        { status: 500 }
      );
    }

    // 1. Check if there's a pending invite
    const invite = await db.query.pendingInvites.findFirst({
      where: eq(pendingInvites.email, userEmail),
    });

    if (!invite) {
      return NextResponse.json({
        onboard: false,
        message: "No pending invitation found for this email",
        userCreated: !user, // Indicate if user was just created
      });
    }

    console.log("📨 Pending invite found:", invite);

    // 2. Check if already a member
    const existingMember = await db.query.boardMembers.findFirst({
      where: and(
        eq(boardMembers.boardId, invite.boardId),
        eq(boardMembers.userId, userId)
      ),
    });

    if (existingMember) {
      // Remove the pending invite if already a member
      await db.delete(pendingInvites).where(eq(pendingInvites.id, invite.id));

      return NextResponse.json({
        onboard: true,
        message: "User already part of the board",
        userCreated: false,
      });
    }

    // 3. Add to board members
    await db.insert(boardMembers).values({
      boardId: invite.boardId,
      userId,
      role: invite.role as "owner" | "editor" | "viewer",
    });

    console.log("✅ Added to board:", invite.boardId);

    // 4. Delete invite
    await db.delete(pendingInvites).where(eq(pendingInvites.id, invite.id));

    console.log("🗑️ Pending invite deleted");

    return NextResponse.json({
      onboard: true,
      message: "Successfully onboarded to the board",
      boardId: invite.boardId,
      userCreated: false, // User existed or was created earlier
    });
  } catch (error) {
    console.error("❌ Error in onboard-user route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}