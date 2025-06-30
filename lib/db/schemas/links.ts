import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { collections } from "./collections";
import { users } from "./users";
users

export const links = pgTable("links", {
  id: uuid("id").defaultRandom().primaryKey(),

  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  favicon: text("favicon"),
  tags: text("tags").array(),
  createdBy: text("created_by").notNull().references(() => users.id),
  collectionId: uuid("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow(),
});
