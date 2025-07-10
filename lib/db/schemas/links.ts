import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { collections } from "./collections";
import { users } from "./users";


export const items = pgTable("items",{
  id:uuid("id").defaultRandom().primaryKey(),

  type:text("type").notNull(),
  title:text("title"),
  url:text("url"),
  description:text("description"),
  favicon:text("favicon"),
  tags:text("tags").array(),
  content:text("content"),
  fileUrl:text("file_url"),

  created_By:text("created_by").notNull().references(() =>users.id),
  collectionId:uuid("collection_id").notNull().references(() =>collections.id,{onDelete:"cascade"}),
   created_At:timestamp("created_at").defaultNow()


})