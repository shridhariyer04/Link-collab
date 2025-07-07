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

    // Look for ALL pending invites for this email (there might be multiple)
    const invites = await db.query.pendingInvites.findMany({
      where: eq(pendingInvites.email, userEmail),
    });

    if (invites.length === 0) {
      console.log("📭 No pending invitations found for this email");
      return NextResponse.json({
        onboard: true,
        message: "User onboarded successfully",
        userCreated: userWasCreated,
        hasInvite: false,
      });
    }

    console.log(`📨 Found ${invites.length} pending invite(s)`);

    let processedInvites = 0;
    let mainBoardId = null;

    // Process each invite
    for (const invite of invites) {
      console.log(`Processing invite for board: ${invite.boardId}`);

      // Check if already a member of this board
      const existingMember = await db.query.boardMembers.findFirst({
        where: and(
          eq(boardMembers.boardId, invite.boardId),
          eq(boardMembers.userId, userId)
        ),
      });

      if (existingMember) {
        console.log(`👥 User already a member of board ${invite.boardId}`);
      } else {
        // Add user to board members
        try {
          await db.insert(boardMembers).values({
            boardId: invite.boardId,
            userId,
            role: invite.role as "owner" | "editor" | "viewer",
          });

          console.log(`✅ Added to board: ${invite.boardId}`);
          processedInvites++;
          
          // Set the first processed board as main board to redirect to
          if (!mainBoardId) {
            mainBoardId = invite.boardId;
          }
        } catch (insertError) {
          console.error(`❌ Error adding user to board ${invite.boardId}:`, insertError);
          // Continue with other invites
        }
      }

      // Delete the processed invite
      try {
        await db.delete(pendingInvites).where(eq(pendingInvites.id, invite.id));
        console.log(`🗑️ Deleted pending invite for board ${invite.boardId}`);
      } catch (deleteError) {
        console.error(`❌ Error deleting pending invite:`, deleteError);
        // This is not critical, continue
      }
    }

    const message = processedInvites > 0 
      ? `Successfully added to ${processedInvites} board(s)`
      : "Welcome! All invitations have been processed.";

    return NextResponse.json({
      onboard: true,
      message,
      boardId: mainBoardId,
      userCreated: userWasCreated,
      hasInvite: true,
      invitesProcessed: processedInvites,
    });

  } catch (error) {
    console.error("❌ Error in onboard-user route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}