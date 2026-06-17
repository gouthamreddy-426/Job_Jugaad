import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as usersSchema from "./schema/users";
import * as resumesSchema from "./schema/resumes";
import * as jobDescriptionsSchema from "./schema/job_descriptions";
import * as analysesSchema from "./schema/analyses";
import * as chatsSchema from "./schema/chats";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required.");
}

const client = postgres(connectionString);

export const db = drizzle(client, {
  schema: {
    ...usersSchema,
    ...resumesSchema,
    ...jobDescriptionsSchema,
    ...analysesSchema,
    ...chatsSchema,
  },
});

export * from "./schema/users";
export * from "./schema/resumes";
export * from "./schema/job_descriptions";
export * from "./schema/analyses";
export * from "./schema/chats";
