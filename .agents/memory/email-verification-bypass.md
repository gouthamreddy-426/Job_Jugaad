---
name: Email verification bypass
description: How to allow email/password login without Supabase email confirmation
---

Create a backend POST /api/auth/signup endpoint using supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true }). Then immediately sign in via supabase.auth.signInWithPassword so the user gets a session.

**Why:** Supabase requires email confirmation by default. Users see "Email not confirmed" on login. The admin API can bypass this on the server side using the SERVICE_KEY.

**How to apply:** The AuthContext signUp() method calls /api/auth/signup (backend) instead of supabase.auth.signUp() (client). The backend controller is backend/src/controllers/auth.controller.ts.
