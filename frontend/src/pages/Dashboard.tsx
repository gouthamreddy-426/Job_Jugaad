import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { getUserAnalyses } from "@/services/api";
import {
  Zap, ArrowLeft, BarChart2, Target, TrendingUp, FileText,
  Briefcase, Clock, ChevronRight, AlertCircle, Sparkles,
  Trophy, Brain, Rocket, RefreshCw, Eye, Star
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

function useCountUp(target: number, duration = 1500, active = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || !target) return;
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

function ScoreRing({ score, size = 80, stroke = 6, color = "hsl(var(--primary))", label = "ATS" }: {
  score: number; size?: number; stroke?: number; color?: string; label?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const count = useCountUp(score, 1200, inView);

  const scoreColor =
    score >= 75 ? "#22c55e" :
    score >= 50 ? "hsl(var(--primary))" :
    "#ef4444";

  return (
    <div ref={ref} className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} opacity={0.3} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={scoreColor} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={inView ? { strokeDashoffset: circ * (1 - score / 100) } : {}}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold leading-none" style={{ fontSize: size * 0.22, color: scoreColor }}>{count}</span>
        <span className="text-muted-foreground uppercase tracking-widest" style={{ fontSize: size * 0.1 }}>{label}</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, delay }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: delay ?? 0 }}
      className="bg-white dark:bg-card rounded-2xl border border-border p-5 flex items-start gap-4"
    >
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground font-medium mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 shadow-xl"
      >
        <FileText className="w-12 h-12 text-primary" />
      </motion.div>
      <h3 className="text-xl font-extrabold text-foreground mb-2">No analyses yet</h3>
      <p className="text-muted-foreground font-medium max-w-sm mb-8">
        Upload your resume and a job description to get your first AI-powered ATS score and skill gap report.
      </p>
      <Link href="/analyze" className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity">
        <Zap className="w-4 h-4" /> Analyze My Resume
      </Link>
    </motion.div>
  );
}

function AnalysisCard({ analysis, index }: { analysis: AnalysisRecord; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const scoreColor =
    analysis.atsScore >= 75 ? "text-green-600" :
    analysis.atsScore >= 50 ? "text-primary" :
    "text-red-500";

  const scoreBg =
    analysis.atsScore >= 75 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" :
    analysis.atsScore >= 50 ? "bg-primary/5 border-primary/20" :
    "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";

  const importanceColors: Record<string, string> = {
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.07 }}
      className="bg-white dark:bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-5 flex items-start gap-5">
        {/* Score ring */}
        <ScoreRing score={analysis.atsScore} size={72} stroke={5} />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h3 className="font-extrabold text-foreground text-base truncate">
                {analysis.role || "Unknown Role"}
              </h3>
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 truncate">
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                {analysis.company || "Unknown Company"}
              </p>
            </div>
            <div className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold ${scoreBg} ${scoreColor}`}>
              {analysis.atsScore}%
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium bg-secondary rounded-lg px-2.5 py-1">
              <Clock className="w-3 h-3" /> {timeAgo(analysis.createdAt)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium bg-secondary rounded-lg px-2.5 py-1">
              <Target className="w-3 h-3" /> {analysis.keywordMatchRate ?? "—"}% keyword match
            </span>
            {analysis.matchedSkills?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-bold bg-green-50 dark:bg-green-900/20 rounded-lg px-2.5 py-1">
                <Star className="w-3 h-3" /> {analysis.matchedSkills.length} matched
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
        >
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </button>
      </div>

      {/* Expanded view */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">

              {/* Overall feedback */}
              {analysis.overallFeedback && (
                <div className="bg-secondary dark:bg-secondary/50 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">AI Feedback</p>
                  <p className="text-sm text-foreground font-medium leading-relaxed">{analysis.overallFeedback}</p>
                </div>
              )}

              {/* Strengths */}
              {analysis.resumeStrengths?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Strengths
                  </p>
                  <div className="space-y-1.5">
                    {analysis.resumeStrengths.slice(0, 3).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                        <span className="text-foreground font-medium">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {analysis.missingSkills?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Skill Gaps
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.missingSkills.slice(0, 8).map((s, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded-lg text-xs font-bold ${importanceColors[s.importance] ?? importanceColors.low}`}>
                        {s.name}
                      </span>
                    ))}
                    {analysis.missingSkills.length > 8 && (
                      <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-secondary text-muted-foreground">
                        +{analysis.missingSkills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Benchmark */}
              {analysis.industryBenchmark > 0 && (
                <div className="flex items-center gap-3 bg-primary/5 rounded-xl p-3">
                  <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-sm font-medium text-foreground">
                    Industry benchmark: <span className="font-bold text-primary">{analysis.industryBenchmark}%</span>
                    {analysis.atsScore >= analysis.industryBenchmark
                      ? <span className="text-green-600 font-bold"> — You're above average! 🎉</span>
                      : <span className="text-muted-foreground"> — {analysis.industryBenchmark - analysis.atsScore}pts to go</span>
                    }
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const floatingIcons = [
  { icon: "🚀", x: 10, y: 15, dur: 4.5, delay: 0 },
  { icon: "✨", x: 85, y: 20, dur: 5, delay: 0.8 },
  { icon: "🎯", x: 70, y: 70, dur: 4, delay: 1.5 },
  { icon: "💡", x: 15, y: 75, dur: 5.5, delay: 0.3 },
  { icon: "📊", x: 50, y: 8, dur: 3.8, delay: 1.2 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const name = user?.user_metadata?.name ?? user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "there";
  const email = user?.email ?? "";
  const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const fetchAnalyses = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getUserAnalyses() as AnalysisRecord[];
      setAnalyses(data ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load analyses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) { setLocation("/login"); return; }
    fetchAnalyses();
  }, [user]);

  const avgScore = analyses.length
    ? Math.round(analyses.reduce((s, a) => s + a.atsScore, 0) / analyses.length)
    : 0;
  const bestScore = analyses.length ? Math.max(...analyses.map(a => a.atsScore)) : 0;
  const totalSkillGaps = analyses.reduce((s, a) => s + (a.missingSkills?.length ?? 0), 0);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Ambient particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }} transition={{ duration: 9, repeat: Infinity }} className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 11, repeat: Infinity, delay: 3 }} className="absolute bottom-0 right-[-10%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px]" />
        {floatingIcons.map((fi, i) => (
          <motion.div key={i} className="absolute text-2xl select-none opacity-20"
            style={{ left: `${fi.x}%`, top: `${fi.y}%` }}
            animate={{ y: [0, -18, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: fi.dur, repeat: Infinity, delay: fi.delay, ease: "easeInOut" }}
          >
            {fi.icon}
          </motion.div>
        ))}
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/60 dark:bg-background/80 border-b border-border sticky top-0"
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-wide hidden sm:block">Job Jugaad AI</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAnalyses(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground"
            title="Refresh"
          >
            <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: "linear" }}>
              <RefreshCw className="w-4 h-4" />
            </motion.div>
          </button>
          <Link href="/analyze" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md shadow-primary/20 hover:opacity-90 transition-opacity">
            <Zap className="w-3.5 h-3.5" /> New Analysis
          </Link>
          <Link href="/profile" className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-secondary transition-colors">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-extrabold">
              {initials}
            </div>
          </Link>
        </div>
      </motion.nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">

        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-1">
            <motion.span
              animate={{ rotate: [0, 15, -10, 0] }}
              transition={{ duration: 2, delay: 0.5 }}
              className="text-3xl"
            >👋</motion.span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Hey, <span className="text-gradient">{name.split(" ")[0]}</span>!
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-base ml-12">
            {analyses.length > 0
              ? `You've run ${analyses.length} analysis${analyses.length > 1 ? "es" : ""}. Keep grinding! 🔥`
              : "Let's get your first resume score. Drop a resume to start!"}
          </p>
        </motion.div>

        {/* Stat cards */}
        {analyses.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<BarChart2 className="w-5 h-5 text-primary" />} label="Avg Score" value={`${avgScore}%`} color="bg-primary/10" delay={0} />
            <StatCard icon={<Trophy className="w-5 h-5 text-yellow-500" />} label="Best Score" value={`${bestScore}%`} color="bg-yellow-500/10" delay={0.1} />
            <StatCard icon={<Brain className="w-5 h-5 text-accent" />} label="Analyses" value={analyses.length} sub="total runs" color="bg-accent/10" delay={0.2} />
            <StatCard icon={<Rocket className="w-5 h-5 text-rose-500" />} label="Skill Gaps" value={totalSkillGaps} sub="to close" color="bg-rose-500/10" delay={0.3} />
          </div>
        )}

        {/* Score trend strip */}
        {analyses.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.35 }}
            className="bg-white dark:bg-card rounded-2xl border border-border p-5 mb-8"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Score History
            </p>
            <div className="flex items-end gap-2 h-16">
              {[...analyses].reverse().slice(0, 10).map((a, i, arr) => {
                const h = Math.max((a.atsScore / 100) * 64, 8);
                const prev = arr[i - 1];
                const up = prev ? a.atsScore >= prev.atsScore : true;
                return (
                  <div key={a.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {a.atsScore}%
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: h }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className={`w-full rounded-t-lg ${up ? "bg-primary" : "bg-red-400"}`}
                    />
                    <span className="text-[9px] text-muted-foreground font-bold hidden md:block">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Analysis list */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" /> Analysis History
          </h2>
          {analyses.length > 0 && (
            <span className="text-xs text-muted-foreground font-bold bg-secondary px-2.5 py-1 rounded-full">
              {analyses.length} record{analyses.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="bg-white dark:bg-card rounded-2xl border border-border h-28"
              />
            ))}
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="font-bold text-red-700 dark:text-red-400">Could not load your analyses</p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">{error}</p>
            </div>
            <button onClick={() => fetchAnalyses(true)} className="ml-auto px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
              Retry
            </button>
          </motion.div>
        ) : analyses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {analyses.map((a, i) => (
              <AnalysisCard key={a.id} analysis={a} index={i} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {analyses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-border rounded-3xl p-8 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-4xl mb-3"
            >🎯</motion.div>
            <h3 className="text-xl font-extrabold text-foreground mb-2">Ready for your next shot?</h3>
            <p className="text-muted-foreground font-medium mb-5">Each analysis gets you closer to your dream role.</p>
            <Link href="/analyze" className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity">
              <Sparkles className="w-4 h-4" /> Run New Analysis
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
