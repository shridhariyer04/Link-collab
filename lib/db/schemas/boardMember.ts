import { pgTable, serial, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { boards } from "./board"; 

export const boardMembers = pgTable("board_members", {
  id: serial("id").primaryKey(),

  boardId: uuid("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),

  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  role: text("role").$type<"owner" | "editor" | "viewer">().notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});
