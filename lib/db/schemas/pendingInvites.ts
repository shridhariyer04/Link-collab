// drizzle schema
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";

export const pendingInvites = pgTable("pending_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  boardId: uuid("board_id").notNull(),
  email: text("email").notNull(),
  role: text("role").default("viewer").notNull(),
  invitedAt: timestamp("invited_at").defaultNow(),
});
