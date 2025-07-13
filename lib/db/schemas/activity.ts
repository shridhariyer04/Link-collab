// db/schemas/activity.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  boardId: uuid("board_id").notNull(),
  collectionId: uuid("collection_id"),
  itemId: uuid("item_id"),
  userId: text("user_id").notNull(),
  action: text("action").notNull(), // e.g., "created_item", "deleted_collection"
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});
