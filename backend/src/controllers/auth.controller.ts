import type { Request, Response } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { query } from "../lib/db.js";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional().default(""),
});

export async function signup(req: Request, res: Response): Promise<void> {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid request" });
    return;
  }

  const { email, password, name } = parsed.data;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || email.split("@")[0] },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists")) {
      res.status(409).json({ error: "An account with this email already exists. Please log in instead." });
    } else {
      res.status(400).json({ error: error.message });
    }
    return;
  }

  const userId = data.user?.id;
  if (userId) {
    try {
      await query(
        `INSERT INTO users (id, email, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = COALESCE(EXCLUDED.name, users.name)`,
        [userId, email, name || email.split("@")[0]]
      );
    } catch (dbErr) {
      console.error("[DB] Failed to insert user:", dbErr instanceof Error ? dbErr.message : dbErr);
    }
  }

  res.json({ message: "Account created successfully. You can now log in." });
}
