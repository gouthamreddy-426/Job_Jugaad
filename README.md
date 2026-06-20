# Job Jugaad AI 🚀

**Job Jugaad AI** is a comprehensive, AI-powered career readiness platform designed to bridge the gap between candidates and their dream jobs. By leveraging advanced Generative AI and RAG (Retrieval-Augmented Generation) architectures, the platform provides deep, actionable insights into resume optimization and interview preparation.

---

## ✨ Comprehensive Feature List

### 📄 1. Intelligent ATS Resume Analysis
Stop guessing what the Applicant Tracking System wants.
* **ATS Compatibility Scoring**: Instantly receive a match percentage based on how well your resume aligns with a specific job description.
* **Skill Gap Identification**: The AI highlights exact skills, tools, and keywords that are missing from your profile but required by the employer.
* **Actionable Resume Recommendations**: Get line-by-line suggestions to rephrase your experience bullets to maximize impact and keyword density.

### 🎤 2. AI-Powered Mock Interview Arena
Practice makes perfect, especially when it's tailored.
* **Context-Aware Question Generation**: The AI generates technical, behavioral, and situational questions based *specifically* on the intersection of your resume and the target role.
* **Real-time Feedback**: Submit your answers and receive immediate, constructive critiques on your communication style, technical accuracy, and completeness.
* **Company-Specific Insights**: Prepare with AI-curated intelligence on the target company's interview patterns, core values, and expected tech stack.

### 🗺️ 3. Personalized Learning Roadmaps
Turn your skill gaps into a structured action plan.
* **Custom Study Plans**: Automatically generates a day-by-day roadmap focusing strictly on the skills you need to acquire for your target job.
* **Curated Resources**: Provides intelligent recommendations for articles, documentation, and courses to accelerate your learning.

### 📊 4. Interactive User Dashboard
Your entire career preparation journey, visualized in one place.
* **Historical Tracking**: Save and review all your past resume analyses and interview feedback.
* **Progress Visualization**: Track how your ATS scores are improving over time as you refine your resume.

### 🔐 5. Secure, Seamless Authentication
* **Multi-provider Login**: Secure access via Google OAuth or standard email and password, powered by Supabase.
* **Data Privacy**: Your resumes and career data are securely stored in PostgreSQL with strict Row Level Security (RLS).

---

## 🛠️ Detailed Tech Stack

### Frontend 
* **Framework**: React 19 + Vite + TypeScript
* **Styling**: Tailwind CSS v4
* **UI Components**: Radix UI (headless accessibility primitives)
* **Animations**: Framer Motion & GSAP
* **State & Data Fetching**: TanStack React Query v5
* **Routing**: Wouter

### Backend
* **Server Framework**: Node.js & Express 5.x + TypeScript
* **Database**: PostgreSQL (hosted via Supabase)
* **Data Validation**: Zod
* **Logging**: Pino (High-performance JSON logging)

### AI & Cloud Services
* **Generative AI**: Groq API (Lightning-fast LLM inference)
* **Auth & DB Hosting**: Supabase

---

## 🚀 Getting Started

To get started with local development or deploying the app to production (Vercel and Render), please refer to our comprehensive step-by-step setup guide:

👉 **[View the Complete Setup Guide](SETUP.md)**

---

## 📂 Project Structure

```text
jobjugaad-ai/
├── frontend/                  # React + Vite + Tailwind CSS frontend
├── backend/                   # Express + TypeScript + Supabase backend
└── database/                  # SQL migrations and database setup
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute to the project.
