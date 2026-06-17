import { pgTable, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { analyses } from "./analyses";

export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  analysisId: uuid("analysis_id").references(() => analyses.id, { onDelete: "set null" }),
  messages: jsonb("messages").default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
