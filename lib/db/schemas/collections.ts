import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { boards } from "./board";
import { users } from "./users";


export const collections = pgTable("collections", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

  boardId: uuid("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
createdBy: text("created_by").notNull().references(() => users.id),

  createdAt: timestamp("created_at").defaultNow(),
});

