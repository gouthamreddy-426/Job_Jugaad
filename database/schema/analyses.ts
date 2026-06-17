import { pgTable, uuid, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { resumes } from "./resumes";
import { jobDescriptions } from "./job_descriptions";

export const analyses = pgTable("analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  resumeId: uuid("resume_id").references(() => resumes.id, { onDelete: "cascade" }).notNull(),
  jdId: uuid("jd_id").references(() => jobDescriptions.id, { onDelete: "cascade" }).notNull(),
  overallMatchScore: integer("overall_match_score"),
  aiReport: jsonb("ai_report").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
