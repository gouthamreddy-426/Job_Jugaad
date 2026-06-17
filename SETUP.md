# Job Jugaad AI — Complete Setup Guide

> Step-by-step instructions: local development → Render (backend) → Vercel (frontend)

---

## 1. What You Need Before Starting

- [Node.js 20+](https://nodejs.org) installed on your machine
- A [Supabase](https://supabase.com) project (free tier works)
- A [Groq](https://console.groq.com) API key (free)
- A [Render](https://render.com) account (free tier)
- A [Vercel](https://vercel.com) account (free tier)
- Git installed

---

## 2. Supabase Setup (Do This First!)

### 2a. Run the Database Migration

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar → **New Query**
3. Open `database/migration.sql` from this project
4. Copy the entire contents, paste into the SQL editor, click **Run**
5. This creates all tables: `users`, `resumes`, `job_descriptions`, `analyses`, `chats`

### 2b. Get Your Supabase Keys

From Supabase → **Settings** → **API**:
- `SUPABASE_URL` — Project URL (e.g. `https://xxxx.supabase.co`)
- `SUPABASE_ANON_KEY` — the **anon / public** key
- `SUPABASE_SERVICE_KEY` — the **service_role** key (never expose this in frontend)

From Supabase → **Settings** → **Database** → **Connection string** → select **Nodejs** tab:
- `SUPABASE_DB_URL` — full PostgreSQL URI (e.g. `postgresql://postgres:pass@db.xxxx.supabase.co:5432/postgres`)

### 2c. Enable Google OAuth (for Google Sign-In button)

1. Supabase → **Authentication** → **Providers** → **Google** → toggle ON
2. Go to [Google Cloud Console](https://console.cloud.google.com) → Create a project → **APIs & Services** → **Credentials** → **Create OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs — add ALL of these:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     http://localhost:5000/auth/callback
     https://<your-vercel-domain>.vercel.app/auth/callback
     ```
3. Copy the Client ID and Secret into Supabase Google provider settings and save

### 2d. Add Redirect URLs in Supabase

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL:** `https://<your-vercel-domain>.vercel.app`
3. **Redirect URLs** — add:
   ```
   http://localhost:5000/auth/callback
   https://<your-vercel-domain>.vercel.app/auth/callback
   ```

---

## 3. Local Development Setup

### 3a. Install Dependencies

```bash
# From the project root folder:

cd backend
npm install
cd ..

cd frontend
npm install
cd ..
```

### 3b. Create Environment Files

**Backend** — create a file called `.env` inside the `backend/` folder:
```
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
SUPABASE_DB_URL=postgresql://postgres:yourpassword@db.xxxx.supabase.co:5432/postgres
GROQ_API_KEY=your_groq_api_key_here
```

**Frontend** — create a file called `.env.local` inside the `frontend/` folder:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
VITE_API_URL=
```
> Leave `VITE_API_URL` empty for local dev — Vite auto-proxies `/api` calls to port 3000.

### 3c. Run the App Locally

Open **two separate terminal windows**:

**Terminal 1 — Backend (port 3000):**
```bash
cd backend
npm run dev
```
You should see: `INFO Server listening port: 3000`

**Terminal 2 — Frontend (port 5000):**
```bash
cd frontend
npm run dev
```
You should see: `VITE v6.x  ready in xxx ms  Local: http://localhost:5000/`

Open your browser at **`http://localhost:5000`**

> The Vite dev server proxies all `/api/*` requests to `http://localhost:3000` automatically — no CORS issues locally.

---

## 4. Deploy Backend to Render

### 4a. Push Your Code to GitHub

Make sure your project is on a GitHub repository. Push the entire project root (not just the backend folder).

### 4b. Create a Web Service on Render

1. Go to [render.com](https://render.com) → **New +** → **Web Service**
2. Connect your GitHub repo
3. Fill in the settings:
   - **Name:** `jobjugaad-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/index.js`
   - **Instance Type:** Free

### 4c. Add Environment Variables on Render

In your Render service → **Environment** tab → Add each variable:

| Key | Value |
|-----|-------|
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | your service_role key |
| `SUPABASE_DB_URL` | your full PostgreSQL URI |
| `GROQ_API_KEY` | your Groq API key |
| `FRONTEND_URL` | `https://your-app.vercel.app` |

Click **Save Changes** and wait for deploy to finish.

### 4d. Verify Backend is Live

Visit: `https://jobjugaad-backend.onrender.com/api/health`
You should see: `{"status":"ok"}`

**Copy your Render URL** — you need it next.

---

## 5. Deploy Frontend to Vercel

### 5a. Create a Project on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repo
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 5b. Add Environment Variables on Vercel

In your Vercel project → **Settings** → **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon/public key |
| `VITE_API_URL` | `https://jobjugaad-backend.onrender.com` |

> `VITE_API_URL` must be your Render URL — **no trailing slash**.

Click **Deploy**.

### 5c. Update Supabase with Your Vercel Domain

After deploy, copy your Vercel URL (e.g. `https://jobjugaad-ai.vercel.app`) and:
1. Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL
3. Add `https://jobjugaad-ai.vercel.app/auth/callback` to **Redirect URLs**

---

## 6. Final Pre-Launch Checklist

- [ ] Migration SQL ran successfully in Supabase
- [ ] Google OAuth set up with all redirect URIs (localhost + Vercel)
- [ ] `backend/.env` has all 6 variables set
- [ ] `frontend/.env.local` has the 2 Supabase variables set
- [ ] Render backend is live: `/api/health` returns `{"status":"ok"}`
- [ ] Vercel `VITE_API_URL` points to your Render backend URL
- [ ] Supabase Redirect URLs include your Vercel domain + `/auth/callback`

---

## 7. Project Structure

```
jobjugaad-ai/
├── frontend/                  # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx    # Home page
│   │   │   ├── Login.tsx      # Email + Google login
│   │   │   ├── Signup.tsx     # Registration
│   │   │   ├── Analyze.tsx    # Resume + JD upload
│   │   │   ├── Results.tsx    # AI analysis results
│   │   │   ├── Dashboard.tsx  # History & stats (auth required)
│   │   │   ├── Profile.tsx    # User profile (auth required)
│   │   │   ├── Practice.tsx   # Mock interviews
│   │   │   └── AuthCallback.tsx  # Google OAuth callback
│   │   ├── context/
│   │   │   ├── AuthContext.tsx    # Supabase auth state
│   │   │   ├── AnalysisContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── services/
│   │   │   └── api.ts         # All backend API calls
│   │   └── lib/
│   │       └── supabase.ts    # Supabase client (uses VITE_ env vars)
│   ├── .env.local             # ← CREATE THIS (not committed to git)
│   └── vite.config.ts
│
├── backend/                   # Express + TypeScript + Supabase
│   ├── src/
│   │   ├── routes/            # analyze, practice, analyses, health
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT verification via Supabase
│   │   └── lib/
│   │       ├── supabase.ts    # Admin client (uses SUPABASE_SERVICE_KEY)
│   │       ├── db.ts          # PostgreSQL pool (uses SUPABASE_DB_URL)
│   │       └── groq.ts        # Groq AI client
│   └── .env                   # ← CREATE THIS (not committed to git)
│
└── database/
    └── migration.sql          # ← Run this in Supabase SQL Editor
```

---

## 8. App Routes Reference

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | No |
| `/login` | Email/password + Google login | No |
| `/signup` | Create account | No |
| `/analyze` | Upload resume + job description | No (saves if logged in) |
| `/results` | AI analysis results | No |
| `/dashboard` | History, stats, past analyses | Yes |
| `/profile` | Edit name, view account info | Yes |
| `/practice` | Mock interview questions | No |
| `/auth/callback` | Google OAuth redirect handler | — |

---

## 9. Troubleshooting

### "Authentication failed" / "Invalid login credentials"
- Double-check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are the correct values
- Frontend must use the **anon/public** key — never the service_role key

### Google Sign-In does nothing / shows error
- The redirect URL must exactly match: your domain + `/auth/callback`
- Check Supabase → Authentication → URL Configuration → Redirect URLs
- Make sure Google OAuth credentials in Google Cloud Console include your exact domain

### "Failed to fetch" on analysis
- In production: make sure `VITE_API_URL` on Vercel points to your live Render backend
- Render free tier **sleeps after 15 minutes of inactivity** — first request after sleep takes ~30 seconds. This is normal.
- Test backend directly: `https://your-backend.onrender.com/api/health`

### Data not saving to Supabase database
- Check `SUPABASE_DB_URL` on Render — must be the **Nodejs** connection string from Supabase → Settings → Database
- Confirm the migration SQL ran without errors in Supabase SQL Editor
- Check Render logs for `[DB] Connected to Supabase PostgreSQL` message on startup

### Backend crashes on Render
- Check Render deploy logs for errors
- Most common cause: missing environment variable (especially `GROQ_API_KEY`)
- Run `npm run build` locally inside `backend/` to catch TypeScript errors before deploying
