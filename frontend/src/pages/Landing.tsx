import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight, CheckCircle2, Zap, BarChart2, Target, BrainCircuit,
  Rocket, TrendingUp, FileText, Briefcase, ChevronRight,
  Moon, Sun, Trophy, User, Star
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

const TITLE = "Job Jugaad AI";
const TAGLINE = "Bridge the gap, get the job.";

const SKILLS_LEFT = ["React", "TypeScript", "Node.js", "REST APIs", "Git"];
const SKILLS_RIGHT = ["React", "Next.js", "GraphQL", "Docker", "AWS", "TypeScript"];
const MISSING = ["Next.js", "GraphQL", "Docker", "AWS"];
const MATCHED = ["React", "TypeScript", "Node.js"];

function useCountUp(target: number, duration = 2000, active = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return count;
}

function AnimatedHeroVisual() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const score = useCountUp(74, 2200, inView);
  const [activeLine, setActiveLine] = useState(0);
  const matchedPairs = [
    { skill: "React", y: 20 },
    { skill: "TypeScript", y: 50 },
    { skill: "Node.js", y: 80 },
  ];

  const floatingSkills = [
    { text: "React ✓", color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400", duration: 4.5, delay: 0, x: -90, y: -50 },
    { text: "Next.js ✗", color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400", duration: 5, delay: 0.5, x: 80, y: -40 },
    { text: "Docker ✗", color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400", duration: 3.5, delay: 1, x: 100, y: 30 },
    { text: "TypeScript ✓", color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400", duration: 4, delay: 1.5, x: -70, y: 40 },
    { text: "AWS ✗", color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400", duration: 5.5, delay: 2, x: 20, y: 80 },
    { text: "Node.js ✓", color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400", duration: 4.2, delay: 0.8, x: -30, y: -80 },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveLine(p => (p + 1) % matchedPairs.length), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay: 0.3 }}
      className="relative w-full max-w-3xl mx-auto mt-14 select-none"
    >
      <div className="relative flex items-center justify-between gap-4 px-2">
        {/* Resume Card */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 w-[220px] shrink-0 overflow-hidden rounded-2xl border border-primary/20 bg-white dark:bg-card shadow-xl shadow-primary/5 dark:shadow-primary/10"
        >
          {/* Scanning line effect */}
          <motion.div
            animate={{ top: ["10%", "85%", "10%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 w-full h-8 z-20 pointer-events-none"
            style={{ background: "linear-gradient(transparent, hsl(var(--primary)/30%), transparent)" }}
          />

          <div className="p-5">
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Resume</span>
            </div>
            <div className="space-y-2 mb-3 relative z-10">
              <div className="h-2 rounded bg-muted w-full" />
              <div className="h-2 rounded bg-muted w-4/5" />
              <div className="h-2 rounded bg-muted w-3/5" />
            </div>
            <div className="space-y-1.5 relative z-10">
              {SKILLS_LEFT.map((skill, i) => (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className={`text-xs px-2 py-1 rounded-md font-mono ${
                    MATCHED.includes(skill)
                      ? "bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                      : "bg-muted/50 text-muted-foreground border border-transparent dark:bg-muted/10"
                  }`}
                >
                  {skill}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Center: Score + animated connections */}
        <div className="relative flex-1 flex flex-col items-center justify-center gap-3 h-48">
          {/* Connection SVG lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 200 200" preserveAspectRatio="none">
            {matchedPairs.map((pair, i) => (
              <motion.line
                key={pair.skill}
                x1="0" y1={`${pair.y}%`}
                x2="100%" y2={`${pair.y}%`}
                stroke={activeLine === i ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                strokeWidth={activeLine === i ? "2" : "1"}
                strokeDasharray="4 4"
                animate={activeLine === i ? {
                  opacity: [0.3, 1, 0.3],
                  strokeDashoffset: [0, -20],
                } : { opacity: 0.3 }}
                transition={{ duration: 1.2, repeat: activeLine === i ? Infinity : 0 }}
              />
            ))}
          </svg>

          {/* Data particles flowing left to right */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute left-[10%] w-1.5 h-1.5 rounded-full bg-primary z-0"
              initial={{ opacity: 0, x: 0, y: `${20 + (i * 7)}%` }}
              animate={{ 
                opacity: [0, 1, 0],
                x: ["0%", "80%"] 
              }}
              transition={{ 
                duration: 1.5 + Math.random(), 
                repeat: Infinity, 
                delay: i * 0.3,
                ease: "linear" 
              }}
            />
          ))}

          {/* Pulsing rings behind ATS score */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute rounded-full border-2 border-primary/30 z-0"
              animate={{ scale: [1, 2.5, 2.5], opacity: [0.6, 0, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
              style={{ width: "96px", height: "96px", left: "calc(50% - 48px)", top: "calc(50% - 48px)" }}
            />
          ))}

          {/* Orbiting Skill Pills */}
          {floatingSkills.map((pill, i) => (
            <motion.div
              key={`pill-${i}`}
              className={`absolute px-2 py-0.5 rounded-full text-[10px] font-mono border z-10 shadow-sm whitespace-nowrap ${pill.color}`}
              style={{ left: `calc(50% + ${pill.x}px)`, top: `calc(50% + ${pill.y}px)` }}
              animate={{ y: [0, -12, 0], rotate: [-3, 3, -3] }}
              transition={{ duration: pill.duration, repeat: Infinity, delay: pill.delay, ease: "easeInOut" }}
            >
              {pill.text}
            </motion.div>
          ))}

          {/* Score ring */}
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-primary/20 blur-xl z-0"
          />
          <motion.div
            animate={{ boxShadow: ["0 0 20px rgba(75, 158, 255, 0.2)", "0 0 40px rgba(75, 158, 255, 0.4)", "0 0 20px rgba(75, 158, 255, 0.2)"] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="relative w-24 h-24 rounded-full border border-primary/20 bg-white dark:bg-card flex flex-col items-center justify-center z-20 shadow-lg"
          >
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="48" cy="48" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" className="opacity-20" />
              <motion.circle
                cx="48" cy="48" r="44"
                fill="none" stroke="url(#scoreGrad)" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                animate={inView ? { strokeDashoffset: 2 * Math.PI * 44 * (1 - 74 / 100) } : {}}
                transition={{ duration: 2.2, ease: "easeOut", delay: 0.4 }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(215 85% 58%)" />
                  <stop offset="100%" stopColor="hsl(330 80% 65%)" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-2xl font-bold text-gradient z-10">{score}</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest z-10">ATS</span>
          </motion.div>
        </div>

        {/* JD Card */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="relative z-10 w-[220px] shrink-0"
        >
          <div className="rounded-2xl border border-accent/20 bg-white dark:bg-card p-5 shadow-xl shadow-accent/5 dark:shadow-accent/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-accent/10">
                <Briefcase className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Job Description</span>
            </div>
            <div className="space-y-2 mb-3">
              <div className="h-2 rounded bg-muted w-full" />
              <div className="h-2 rounded bg-muted w-3/4" />
              <div className="h-2 rounded bg-muted w-5/6" />
            </div>
            <div className="space-y-1.5">
              {SKILLS_RIGHT.map((skill, i) => (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className={`text-xs px-2 py-1 rounded-md font-mono ${
                    MISSING.includes(skill)
                      ? "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                      : "bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                  }`}
                >
                  {MISSING.includes(skill) ? "✗ " : "✓ "}{skill}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function TitleReveal() {
  const letters = TITLE.split("");
  return (
    <div className="overflow-hidden mb-3">
      <motion.div className="flex items-center justify-center gap-0 flex-wrap">
        {letters.map((char, i) => (
          <motion.span
            key={i}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.05 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className={`text-5xl md:text-7xl font-extrabold tracking-tight ${
              char === " " ? "w-4" : ""
            } ${i > 3 ? "text-gradient" : "text-foreground dark:text-white"}`}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

function TaglineReveal() {
  const words = TAGLINE.split(" ");
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-2">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 + i * 0.1, ease: "easeOut" }}
          className="text-xl md:text-3xl font-medium text-accent tracking-wide"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

const features = [
  {
    icon: <BrainCircuit className="w-7 h-7 text-primary" />,
    title: "Smart Keyword Match",
    desc: "Extracts every keyword a recruiter's ATS is scanning for and maps it against your resume instantly.",
  },
  {
    icon: <Target className="w-7 h-7 text-accent" />,
    title: "Skill Gap X-Ray",
    desc: "Pinpoints exactly which skills are missing — ranked by criticality so you know where to focus first.",
  },
  {
    icon: <TrendingUp className="w-7 h-7 text-green-500" />,
    title: "ATS Score Engine",
    desc: "Get a real-time compatibility score with industry benchmarks so you can measure your progress.",
  },
  {
    icon: <Rocket className="w-7 h-7 text-yellow-500" />,
    title: "Actionable Fixes",
    desc: "Targeted rewrites for each resume section — not vague advice, but specific lines to add or improve.",
  },
  {
    icon: <BarChart2 className="w-7 h-7 text-pink-500" />,
    title: "Industry Benchmark",
    desc: "See how your resume stacks up against the average candidate applying for the same role.",
  },
  {
    icon: <CheckCircle2 className="w-7 h-7 text-indigo-500" />,
    title: "Instant Results",
    desc: "No sign-up. No waiting. Paste your resume and JD, and get a full intelligence report in seconds.",
  },
];

const stats = [
  { value: "94%", label: "of resumes fail ATS" },
  { value: "3 sec", label: "avg recruiter scan time" },
  { value: "6×", label: "more interviews" },
];

const steps = [
  { num: "01", title: "Upload Resume", desc: "Drop your resume PDF or paste text into the left panel." },
  { num: "02", title: "Add Job Description", desc: "Paste the JD from any job board into the right panel." },
  { num: "03", title: "Get Your Gap Report", desc: "Receive an ATS score, skill gaps, and fixes — instantly." },
];

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background dark:bg-background text-foreground overflow-x-hidden font-sans">
      {/* ─── NAV ─── */}
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/70 dark:bg-background/90 border-b border-border dark:border-border"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-wide dark:text-white">{TITLE}</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-bold">
          <Link href="/" className="text-foreground hover:text-primary transition-colors">Home</Link>
          <Link href="/practice" className="flex items-center gap-1.5 text-foreground hover:text-accent transition-colors">
            <Trophy className="w-4 h-4 text-accent" /> Practice Arena
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggle} className="p-2 rounded-xl border border-border hover:bg-secondary dark:hover:bg-card transition-colors" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/dashboard" className="items-center gap-1.5 px-4 py-2 rounded-full border-2 border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-all inline-flex">
                <BarChart2 className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/profile" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95">
                <User className="w-4 h-4" /> Profile
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-all">
                Login
              </Link>
              <Link href="/signup" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </motion.nav>

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-20 overflow-hidden">
        {/* Pastel Blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-primary/20 dark:bg-primary/10 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-accent/20 dark:bg-accent/10 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.4, 0.3] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-[100px]"
          />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 w-full text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-card border border-primary/20 text-primary mb-8 shadow-sm"
          >
            {/* <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-primary inline-block"
            />
            <span className="text-xs font-bold tracking-widest uppercase">Free — No sign-up needed</span> */}
          </motion.div>

          <TitleReveal />
          <TaglineReveal />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mt-5 mb-8 font-medium leading-relaxed"
          >
            Paste your resume and any job description. Get your ATS score, skill gap report, and targeted fixes in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/analyze" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-1 active:translate-y-0" data-testid="hero-analyze-btn">
              Analyze My Resume <ArrowRight className="w-5 h-5" />
            </Link>
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Instant results
            </span>
          </motion.div>

          <AnimatedHeroVisual />
        </motion.div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="relative z-10 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 dark:bg-primary/5 border-y border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 divide-x divide-border/50">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="text-center px-4 py-2"
              >
                <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">{s.value}</div>
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-28 relative z-10 bg-white dark:bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-xs text-primary uppercase tracking-widest font-bold mb-3">How it works</div>
            <h2 className="text-3xl md:text-5xl font-extrabold dark:text-white">Three steps to your dream job</h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-12 top-10 bottom-10 w-1 bg-gradient-to-b from-primary/30 via-accent/30 to-transparent hidden md:block rounded-full" />
            <div className="space-y-12">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.15 }}
                  className="flex items-start gap-6 md:gap-8"
                >
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-card border-2 border-primary/20 shadow-lg shadow-primary/10 flex items-center justify-center font-extrabold text-primary text-lg z-10 relative">
                    {step.num}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-2xl font-bold mb-2 text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground font-medium text-lg">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-28 relative z-10 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-xs text-accent uppercase tracking-widest font-bold mb-3">Features</div>
            <h2 className="text-3xl md:text-5xl font-extrabold dark:text-white">Everything you need to beat the bots</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -6, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)" }}
                className="p-8 rounded-3xl bg-white dark:bg-card border border-border dark:border-border transition-all cursor-default shadow-sm dark:shadow-border/20"
              >
                <div className="mb-6 p-4 rounded-2xl bg-muted/30 dark:bg-muted/10 inline-block">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="py-32 relative z-10 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-primary/5 dark:via-background dark:to-accent/5">
        <div className="container mx-auto px-4 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}>
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </motion.div>
              ))}
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-foreground">
              Ready to close the gap?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 font-medium">Join thousands of students landing their first job with AI-optimized resumes.</p>
            <Link href="/analyze" className="inline-flex items-center gap-2 px-10 py-5 bg-white dark:bg-card text-foreground border-2 border-primary/20 font-bold rounded-2xl text-lg shadow-xl shadow-primary/10 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all active:translate-y-0" data-testid="cta-analyze-btn">
              Analyze My Resume <ArrowRight className="w-5 h-5 text-primary" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
