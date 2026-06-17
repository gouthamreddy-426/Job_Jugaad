-- ============================================================
-- Job Jugaad AI — Database Migration
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Users Table
-- Note: password_hash is kept NULL-safe for Supabase Auth users.
-- If you switch to custom JWT auth, populate password_hash yourself.
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  education_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Resumes Table
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT,
  parsed_content JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Job Descriptions Table
CREATE TABLE IF NOT EXISTS public.job_descriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  company TEXT DEFAULT '',
  role TEXT DEFAULT '',
  parsed_requirements JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Analyses Table
-- ai_report stores the full structured AI result as JSONB
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  jd_id UUID REFERENCES public.job_descriptions(id) ON DELETE CASCADE NOT NULL,
  overall_match_score INTEGER,
  ai_report JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Chats Table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_jd_user_id ON public.job_descriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_analysis_id ON public.chats(analysis_id);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies — users
DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can read their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies — resumes
DROP POLICY IF EXISTS "Users can read their own resumes" ON public.resumes;
CREATE POLICY "Users can read their own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies — job_descriptions
DROP POLICY IF EXISTS "Users can read their own jds" ON public.job_descriptions;
CREATE POLICY "Users can read their own jds" ON public.job_descriptions FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies — analyses
DROP POLICY IF EXISTS "Users can read their own analyses" ON public.analyses;
CREATE POLICY "Users can read their own analyses" ON public.analyses FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies — chats
DROP POLICY IF EXISTS "Users can read their own chats" ON public.chats;
CREATE POLICY "Users can read their own chats" ON public.chats FOR SELECT USING (auth.uid() = user_id);

-- Service role bypasses RLS automatically (used by backend with SERVICE_KEY)
