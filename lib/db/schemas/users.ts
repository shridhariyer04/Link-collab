import { pgTable, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk ID
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
});
