import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const jobDescriptions = pgTable("job_descriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  company: text("company").default(""),
  role: text("role").default(""),
  parsedRequirements: jsonb("parsed_requirements").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type JobDescription = typeof jobDescriptions.$inferSelect;
export type NewJobDescription = typeof jobDescriptions.$inferInsert;
