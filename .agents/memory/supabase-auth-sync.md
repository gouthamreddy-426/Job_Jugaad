---
name: Supabase auth + public tables sync
description: How to keep public.users in sync with auth.users for this project
---

The public.users table MUST use `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` — NOT gen_random_uuid(). Without this, backend inserts with auth user IDs fail with FK violations.

A trigger `handle_new_user()` on `auth.users AFTER INSERT` auto-inserts into public.users. This handles both email/password and Google OAuth signups.

**Why:** Supabase separates auth.users from public schema. All other tables (resumes, analyses, etc.) reference public.users.id, which must equal auth.users.id for FK integrity.

**How to apply:** Run migration.sql (v2) in Supabase SQL Editor every time the schema changes.
