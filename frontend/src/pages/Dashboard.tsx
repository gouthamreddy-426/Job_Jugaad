import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getUserAnalyses } from "@/services/api";
import {
  Zap, ArrowLeft, BarChart2, Target, TrendingUp, FileText,
  Clock, ChevronDown, ChevronUp, AlertCircle, Sparkles,
  Trophy, Brain, Rocket, RefreshCw, Star, Plus, Moon, Sun, LogIn
} from "lucide-react";

interface AnalysisRecord {
  id: string;
  atsScore: number;
  keywordMatchRate: number;
  company: string;
  role: string;
  createdAt: string;
  matchedSkills: string[];
  missingSkills: Array<{ name: string; importance: string }>;
  overallFeedback: string;
  industryBenchmark: number;
  resumeStrengths: string[];
}

function useCountUp(target: number, duration = 1200, active = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || !target) { setCount(0); return; }
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

function ScoreRing({ score, size = 84, stroke = 7, color, label }: {
  score: number; size?: number; stroke?: number; color: string; label: string;
}) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const count = useCountUp(score, 1200, active);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke}
            className="text-border" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circ}
            strokeDashoffset={active ? circ * (1 - count / 100) : circ}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-foreground tabular-nums">{count}</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">%</span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
    </div>
  );
}

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 86400 * 30) return `${Math.floor(d / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function scoreMeta(s: number) {
  if (s >= 80) return { label: "Strong Match", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", color: "hsl(var(--primary))" };
  if (s >= 60) return { label: "Moderate", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", color: "#f59e0b" };
  return { label: "Needs Work", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", color: "#ef4444" };
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const [, setLocation] = useLocation();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [user, loading, setLocation]);

  // Fetch real data from backend
  useEffect(() => {
    if (!user) return;
    setFetching(true);
    setFetchError(null);
    getUserAnalyses()
      .then((data) => {
        setAnalyses(Array.isArray(data) ? (data as AnalysisRecord[]) : []);
      })
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : "Failed to load analyses");
        setAnalyses([]);
      })
      .finally(() => setFetching(false));
  }, [user]);

  const avg = analyses.length ? Math.round(analyses.reduce((a, b) => a + b.atsScore, 0) / analyses.length) : 0;
  const best = analyses.length ? Math.max(...analyses.map((a) => a.atsScore)) : 0;
  const kwAvg = analyses.length ? Math.round(analyses.reduce((a, b) => a + b.keywordMatchRate, 0) / analyses.length) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Background accent */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-border bg-background/80 backdrop-blur-md sticky top-0">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-sm hidden sm:block">Job Jugaad AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/analyze"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> New Scan
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3 h-3" /> Your Dashboard
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-2 text-foreground leading-tight">
            Career <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Intel</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            {analyses.length > 0
              ? `${analyses.length} scan${analyses.length !== 1 ? "s" : ""} on record — keep pushing.`
              : "Run your first scan to start tracking your progress."}
          </p>
        </motion.div>

        {/* Stats row */}
        {analyses.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: <BarChart2 className="w-5 h-5" />, label: "Avg ATS Score", val: `${avg}%`, sub: "across all scans", color: "primary" },
              { icon: <Trophy className="w-5 h-5" />, label: "Best Score", val: `${best}%`, sub: "personal record", color: "accent" },
              { icon: <Target className="w-5 h-5" />, label: "Avg Keyword Match", val: `${kwAvg}%`, sub: "keyword coverage", color: "emerald" },
              { icon: <Brain className="w-5 h-5" />, label: "Total Scans", val: String(analyses.length), sub: "analyses done", color: "violet" },
            ].map((s, i) => (
              <motion.div key={i} custom={i} variants={cardVariants} initial="hidden" animate="visible"
                className={`group rounded-2xl p-5 border border-border bg-white dark:bg-card hover:shadow-md transition-all cursor-default`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  s.color === "primary" ? "bg-primary/10 text-primary" :
                  s.color === "accent" ? "bg-accent/10 text-accent" :
                  s.color === "emerald" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                  "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                }`}>{s.icon}</div>
                <p className="text-3xl font-black text-foreground mb-0.5 tabular-nums">{s.val}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Error state */}
        {fetchError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Couldn't load your analyses</p>
              <p className="text-xs mt-0.5 font-medium">{fetchError}</p>
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {fetching && (
          <div className="flex flex-col items-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm font-medium">Loading your analyses…</p>
          </div>
        )}

        {/* Empty state */}
        {!fetching && !fetchError && analyses.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-24">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">No analyses yet</h3>
            <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
              Run your first AI analysis to start building your career intelligence dashboard.
            </p>
            <Link href="/analyze"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              <Zap className="w-5 h-5" /> Analyze My Resume
            </Link>
          </motion.div>
        )}

        {/* Analysis history */}
        {!fetching && analyses.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Analysis History
              </h2>
              <span className="text-xs text-muted-foreground font-medium">{analyses.length} record{analyses.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-3">
              {analyses.map((a, i) => {
                const meta = scoreMeta(a.atsScore);
                const isOpen = expanded === a.id;
                return (
                  <motion.div key={a.id} custom={i} variants={cardVariants} initial="hidden" animate="visible"
                    whileHover={{ y: -2 }}
                    className="rounded-2xl border border-border bg-white dark:bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">

                    {/* Card header */}
                    <button
                      className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 text-left"
                      onClick={() => setExpanded(isOpen ? null : a.id)}
                    >
                      <div className="shrink-0">
                        <ScoreRing score={a.atsScore} color={meta.color} label="ATS" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-base font-black text-foreground">
                            {a.role || "Resume Scan"}
                          </span>
                          {a.company && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">
                              {a.company}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium line-clamp-1 mb-2">
                          {a.overallFeedback}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {a.matchedSkills?.slice(0, 5).map((sk) => (
                            <span key={sk} className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold">
                              {sk}
                            </span>
                          ))}
                          {(a.matchedSkills?.length ?? 0) > 5 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border font-semibold">
                              +{a.matchedSkills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2">
                        <div className="text-center sm:text-right">
                          <p className="text-xl font-black text-foreground tabular-nums">{a.keywordMatchRate ?? 0}%</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Keywords</p>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{timeAgo(a.createdAt)}
                        </span>
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="detail"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border px-5 pb-5 pt-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* Strengths */}
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                                <Star className="w-3 h-3" /> Strengths
                              </h4>
                              <ul className="space-y-1.5">
                                {a.resumeStrengths?.slice(0, 4).map((s, j) => (
                                  <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-emerald-500 shrink-0 mt-0.5 font-bold">✓</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Skill gaps */}
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-red-500 mb-3 flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3" /> Skill Gaps
                              </h4>
                              <ul className="space-y-1.5">
                                {a.missingSkills?.slice(0, 5).map((sk, j) => (
                                  <li key={j} className="text-sm text-muted-foreground flex items-center justify-between gap-2">
                                    <span className="truncate">{sk.name}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                      sk.importance === "critical" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                      sk.importance === "high" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    }`}>{sk.importance}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Benchmark + actions */}
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3" /> vs Benchmark
                              </h4>
                              <div className="mb-4">
                                <div className="relative h-2 bg-secondary rounded-full mb-1.5 overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                                    style={{ width: `${a.atsScore}%` }} />
                                  <div className="absolute top-0 h-full w-0.5 bg-foreground/40"
                                    style={{ left: `${a.industryBenchmark ?? 70}%` }} />
                                </div>
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                  <span>You: <strong className="text-foreground">{a.atsScore}%</strong></span>
                                  <span>Avg: <strong className="text-primary">{a.industryBenchmark ?? 70}%</strong></span>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <Link href="/analyze"
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors">
                                  <RefreshCw className="w-3 h-3" /> Re-analyze
                                </Link>
                                <Link href="/practice"
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-accent/10 text-accent border border-accent/20 text-xs font-bold hover:bg-accent/20 transition-colors">
                                  <Rocket className="w-3 h-3" /> Practice
                                </Link>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
