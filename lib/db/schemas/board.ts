import { pgTable, text, uuid, boolean, timestamp } from "drizzle-orm/pg-core";

export const boards = pgTable("boards", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdBy: text("created_by").notNull(), // Clerk user ID
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
