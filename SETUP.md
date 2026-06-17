# Job Jugaad AI — Complete Setup Guide

> **Why Express and not FastAPI?**  
> The entire project — frontend and backend — is written in TypeScript. Using Express means one language, shared types between front and back, and zero Python environment headaches. FastAPI is great for Python ML workflows, but for this project TypeScript-everywhere is the cleaner choice.

---

## Quick overview of the stack

| Layer | Technology | Deployed on |
|-------|-----------|-------------|
| Frontend | React 19 + Vite + Tailwind | Vercel |
| Backend | Express 5 + TypeScript (tsx) | Render |
| Database / Auth | Supabase (PostgreSQL + Auth) | Supabase cloud |
| AI | Groq API (llama-3.3-70b) | groq.com |

---

## Prerequisites

Install these before you do anything else:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | **v20 or v22** (LTS) | https://nodejs.org |
| npm | comes with Node.js | — |
| Git | any recent version | https://git-scm.com |

**Check you have the right versions:**
```bash
node -v    # must print v20.x.x or v22.x.x
npm -v     # must print 10.x.x or higher
```

---

## Step 1 — Download & extract

1. Download `jobjugaad-ai.zip` from the link provided.
2. **Windows only — IMPORTANT**: Right-click the zip → "Extract All". Do **not** open files directly from inside the zip.
3. Place the extracted folder somewhere without spaces in the path:
   - ✅ `C:\Projects\jobjugaad-ai`
   - ❌ `C:\Users\My Name\Downloads\jobjugaad-ai` (spaces can cause issues)

---

## Step 2 — Install dependencies

Open a terminal (PowerShell or CMD on Windows, Terminal on Mac/Linux) and run these commands **one by one**:

```bash
# Navigate into the project folder
cd C:\Projects\jobjugaad-ai        # Windows
# cd ~/Projects/jobjugaad-ai       # Mac/Linux

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Windows EPERM error fix

If you see `EPERM: operation not permitted` errors on Windows:

**Option A — Delete node_modules first (recommended)**
```powershell
# Run in PowerShell as Administrator
cd C:\Projects\jobjugaad-ai\frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install

cd ..\backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
```

**Option B — Use npm with legacy peer deps**
```bash
npm install --legacy-peer-deps
```

**Option C — Run terminal as Administrator**
- Right-click PowerShell → "Run as Administrator", then run the install commands.

---

## Step 3 — Supabase setup

### 3a. Create a free Supabase project
1. Go to https://supabase.com → Sign in → New Project
2. Choose a region close to you
3. Wait ~2 minutes for it to provision

### 3b. Run the database migration
1. In your Supabase project → **SQL Editor** (left sidebar) → **New Query**
2. Open the file `database/migration.sql` from this project in a text editor
3. Copy **all** the contents → paste into the SQL Editor → click **Run**
4. You should see "Success. No rows returned"

### 3c. Get your API keys
Go to **Settings** (gear icon, bottom left) → **API**

Copy these three values — you'll need them in Step 5:

| What | Where it shows | Goes into |
|------|---------------|-----------|
| Project URL | "Project URL" box | Both `.env` files |
| `anon` / `public` key | Under "Project API keys" | `frontend/.env.local` |
| `service_role` key | Under "Project API keys" (click reveal) | `backend/.env` |

> ⚠️ **Never commit the service_role key to GitHub.** It has full database access.

### 3d. Get your database connection string
**Settings → Database → Connection string → URI tab**

It looks like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

---

## Step 4 — Get a free Groq API key

1. Go to https://console.groq.com → sign up (free, no credit card)
2. **API Keys → Create New Key** → copy it

---

## Step 5 — Create environment files

### Backend — create `backend/.env`

Create a new file called `.env` inside the `backend/` folder. Copy this exactly and fill in your values:

```env
PORT=3000
NODE_ENV=development

# Your Supabase project URL
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Your service_role key (from Supabase Settings → API)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your database connection string (from Supabase Settings → Database → URI)
DATABASE_URL=postgresql://postgres:yourpassword@db.xxxx.supabase.co:5432/postgres

# Your Groq API key
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5000
```

### Frontend — create `frontend/.env.local`

Create a new file called `.env.local` inside the `frontend/` folder:

```env
# Backend URL
VITE_API_URL=http://localhost:3000

# Your Supabase project URL
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Your anon/public key (from Supabase Settings → API)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Windows tip**: Make sure these files are named exactly `.env` and `.env.local` — not `env.txt` or `.env.txt`. In Notepad, choose "All Files" in the Save As dialog to avoid the `.txt` extension being added.

---

## Step 6 — Run the project locally

Open **two** terminals (two separate windows/tabs):

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
```
You should see:
```
Server listening  port: 3000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```
You should see:
```
VITE ready in 1234 ms
➜  Local:   http://localhost:5000/
```

Open http://localhost:5000 in your browser.

---

## Step 7 — Test everything works

1. Go to http://localhost:5000
2. Click **Analyze My Resume**
3. Paste some sample resume text and a job description
4. Click Analyze — you should get a results dashboard with ATS score

If it works without login, the core AI pipeline is working. To test login/signup, make sure your Supabase env vars are set.

---

## Step 8 — Deploy to Vercel (Frontend)

1. Push your code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/jobjugaad-ai.git
   git push -u origin main
   ```

2. Go to https://vercel.com → **Add New Project** → import your GitHub repo

3. In the Vercel project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)

4. Add **Environment Variables** (Settings → Environment Variables):
   ```
   VITE_API_URL         = https://your-render-backend.onrender.com
   VITE_SUPABASE_URL    = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJ...
   ```

5. Click **Deploy**. Your frontend will be live at `https://jobjugaad.vercel.app` (or similar).

---

## Step 9 — Deploy to Render (Backend)

1. Go to https://render.com → **New → Web Service** → connect your GitHub repo

2. In the service settings:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
   - **Instance type**: Free (or Starter for no sleep)

3. Add **Environment Variables** (Environment tab):
   ```
   NODE_ENV             = production
   PORT                 = 3000
   SUPABASE_URL         = https://xxxx.supabase.co
   SUPABASE_SERVICE_KEY = eyJ...
   DATABASE_URL         = postgresql://postgres:...
   GROQ_API_KEY         = gsk_...
   FRONTEND_URL         = https://your-vercel-app.vercel.app
   ```

4. Click **Create Web Service**. First deploy takes ~3 minutes.

5. Copy your Render URL (e.g. `https://jobjugaad-backend.onrender.com`) and update:
   - Vercel env var `VITE_API_URL` → your Render URL
   - Supabase **Auth → URL Configuration → Redirect URLs** → add `https://your-vercel-app.vercel.app/**`

---

## Step 10 — Update Supabase Auth redirect URLs

In Supabase Dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://your-vercel-app.vercel.app`
- **Redirect URLs**: add `https://your-vercel-app.vercel.app/**`

This is required for email confirmation and OAuth redirects to work in production.

---

## Database Schema Reference

```
users            — id, name, email, password_hash (nullable), education_details, created_at
resumes          — id, user_id, file_url, parsed_content (jsonb), created_at
job_descriptions — id, user_id, company, role, parsed_requirements (jsonb), created_at
analyses         — id, user_id, resume_id, jd_id, overall_match_score, ai_report (jsonb), created_at
chats            — id, user_id, analysis_id, messages (jsonb), updated_at
```

`analyses.ai_report` stores the full AI response including `improvementTips` (with `toAdd[]` and `toRemove[]` per section) and `skillsToLearn[]`.

---

## Common errors and fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ENOTFOUND package-firewall.replit.local` | Old lock file with Replit's internal proxy | Delete `node_modules` + `package-lock.json`, run `npm install` fresh |
| `EPERM: operation not permitted` | Windows file lock on node_modules | Run PowerShell as Administrator, delete node_modules manually, reinstall |
| `401 Unauthorized` from API | Missing SUPABASE_SERVICE_KEY | Add it to `backend/.env` |
| Auth / login not working | Missing Supabase anon key | Add `VITE_SUPABASE_ANON_KEY` to `frontend/.env.local` |
| CORS errors in browser | Wrong FRONTEND_URL | Set `FRONTEND_URL` in `backend/.env` to your exact frontend URL |
| Analyses not saving to DB | Migration not run | Run `database/migration.sql` in Supabase SQL Editor |
| Render backend sleeping | Free tier sleeps after 15 min | Upgrade to Starter ($7/mo) or use Railway |
| PDF upload fails | Browser API issue | Use the "Paste text" tab instead |

### Fastest fix if npm install fails on Windows

```powershell
# Run PowerShell as Administrator

# Frontend
cd C:\Projects\jobjugaad-ai\frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install

# Backend
cd ..\backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
```

This deletes the lock file (which had Replit's internal proxy URLs) and reinstalls everything fresh from the public npm registry.
