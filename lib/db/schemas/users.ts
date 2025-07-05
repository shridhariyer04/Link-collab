import { pgTable, text,timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk ID
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  createdAt:timestamp("created_at").defaultNow(),
  updatedAt:timestamp("updatde_at").defaultNow()
});
