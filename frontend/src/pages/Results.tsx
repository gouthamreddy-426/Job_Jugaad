import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { useAnalysis } from "@/context/AnalysisContext";
import type { SectionImprovement } from "@/types/analysis";
import {
  CheckCircle2, RefreshCw, ChevronRight, Copy, Activity,
  Moon, Sun, Dumbbell, PlusCircle, MinusCircle, BookOpen,
  Clock, TrendingUp, Star, Quote, ChevronDown, ChevronUp,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { useTheme } from "@/context/ThemeContext";

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function ImprovementCard({ tip, index }: { tip: SectionImprovement; index: number }) {
  const [expanded, setExpanded] = useState(true);
  const sectionColors = [
    "border-l-blue-500", "border-l-purple-500", "border-l-emerald-500",
    "border-l-orange-500", "border-l-pink-500", "border-l-cyan-500",
  ];
  const borderColor = sectionColors[index % sectionColors.length];

  const hasAdd = tip.toAdd && tip.toAdd.length > 0;
  const hasDel = tip.toRemove && tip.toRemove.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className={`bg-white dark:bg-card border border-border rounded-2xl overflow-hidden border-l-4 ${borderColor}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/40 transition-colors"
      >
        <span className="font-extrabold text-base text-foreground">{tip.section}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
            <PlusCircle className="w-3 h-3" /> {tip.toAdd?.length ?? 0} to Add
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
            <MinusCircle className="w-3 h-3" /> {tip.toRemove?.length ?? 0} to Remove
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border border-t border-border">
              <div className="p-5 space-y-2">
                <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-emerald-600 mb-3">
                  <PlusCircle className="w-4 h-4" /> Add / Strengthen
                </h4>
                {hasAdd ? tip.toAdd.map((item, j) => (
                  <div key={j} className="flex items-start gap-3 p-3 bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-foreground leading-snug">{item}</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground italic">No additions needed for this section.</p>
                )}
              </div>

              <div className="p-5 space-y-2">
                <h4 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-red-600 mb-3">
                  <MinusCircle className="w-4 h-4" /> Remove / Rewrite
                </h4>
                {hasDel ? tip.toRemove.map((item, j) => (
                  <div key={j} className="flex items-start gap-3 p-3 bg-red-50/60 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-foreground leading-snug">{item}</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground italic">Nothing needs removing from this section.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Results() {
  const [, setLocation] = useLocation();
  const { result } = useAnalysis();
  const { toast } = useToast();
  const { theme, toggle } = useTheme();

  const atsScore = useCountUp(result?.atsScore ?? 0, 1500);

  useEffect(() => {
    if (!result) setLocation("/analyze");
  }, [result, setLocation]);

  if (!result) return null;

  const scoreColor = atsScore >= 75 ? "text-green-500" : atsScore >= 50 ? "text-yellow-500" : "text-red-500";
  const scoreStroke = atsScore >= 75 ? "stroke-green-500" : atsScore >= 50 ? "stroke-yellow-500" : "stroke-red-500";

  const pieData = [
    { name: "Matched", value: result.keywordMatchRate, color: "#4ade80" },
    { name: "Missing", value: 100 - result.keywordMatchRate, color: "#fca5a5" },
  ];

  const categories = ["Technical", "Tools", "Soft Skills", "Domain Knowledge", "Certifications"];
  const catData = categories.map(cat => ({
    name: cat.split(" ")[0],
    missing: result.missingSkills.filter(s => s.category === cat).length,
  })).filter(d => d.missing > 0);

  const radarData = categories.map(cat => {
    const missing = result.missingSkills.filter(s => s.category === cat).length;
    const matched = result.matchedSkills.length > 0 ? Math.round(result.matchedSkills.length / categories.length) : 0;
    const total = missing + matched;
    const score = total === 0 ? 75 : Math.round((matched / total) * 100);
    return { subject: cat.split(" ")[0], score, fullMark: 100 };
  });

  const benchmarkData = [
    { category: "Your Score", value: result.atsScore, fill: "hsl(var(--primary))" },
    { category: "Industry Avg", value: result.industryBenchmark, fill: "#94a3b8" },
    { category: "Top 10%", value: Math.min(result.industryBenchmark + 18, 98), fill: "#4ade80" },
  ];

  const importanceConfig: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", border: "border-red-300 dark:border-red-700" },
    high: { bg: "bg-orange-100 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400", border: "border-orange-300 dark:border-orange-700" },
    medium: { bg: "bg-yellow-100 dark:bg-yellow-900/20", text: "text-yellow-800 dark:text-yellow-400", border: "border-yellow-300 dark:border-yellow-700" },
    low: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", border: "border-slate-300 dark:border-slate-600" },
  };

  const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", label: "Critical" },
    high: { bg: "bg-orange-100 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400", label: "High" },
    medium: { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Medium" },
  };

  const tooltipStyle = { fontFamily: "Plus Jakarta Sans", fontWeight: 600, borderRadius: "12px", border: "1px solid hsl(var(--border))" };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Share your gap report." });
  };

  return (
    <div
      className="min-h-screen font-sans relative overflow-x-hidden dark:bg-background dark:text-foreground"
      style={{
        background: theme === "dark"
          ? "hsl(var(--background))"
          : "linear-gradient(135deg, hsl(223 100% 98%) 0%, hsl(250 60% 97%) 40%, hsl(330 40% 97%) 100%)",
      }}
    >
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sticky Nav */}
      <div className="sticky top-0 z-50 bg-white/70 dark:bg-card/80 backdrop-blur-xl border-b border-white/50 dark:border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-extrabold text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Job Jugaad AI
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setLocation("/analyze")}
              className="px-4 py-1.5 bg-white border border-border hover:bg-secondary font-bold rounded-xl transition-colors flex items-center gap-2 text-sm shadow-sm dark:bg-secondary dark:hover:bg-muted dark:text-foreground"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Run New Scan
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto pt-12 pb-24 px-4 relative z-10 space-y-12">

        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-foreground">Your Gap Report</h1>
          <p className="text-muted-foreground font-medium">
            Generated {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Hero Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="w-full bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-3xl shadow-xl p-8 flex flex-col md:flex-row items-center gap-10 border border-white/60 dark:border-border"
        >
          <div className="relative w-56 h-56 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--background))" strokeWidth="8" />
              <motion.circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                className={scoreStroke}
                initial={{ strokeDasharray: "0 264" }}
                animate={{ strokeDasharray: `${(result.atsScore / 100) * 264} 264` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-5xl font-extrabold ${scoreColor}`}>{atsScore}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">ATS Score</span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {[
              { label: "Keyword Match", value: `${result.keywordMatchRate}%`, sub: "of JD keywords found", color: "text-primary" },
              { label: "Industry Benchmark", value: `${result.industryBenchmark}`, sub: "avg score for this role", color: "text-yellow-500" },
              { label: "Skills Found", value: `${result.matchedSkills.length}/${result.matchedSkills.length + result.missingSkills.length}`, sub: "total skills mapped", color: "text-emerald-500" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/60 dark:bg-card/60 backdrop-blur p-4 rounded-2xl flex flex-col gap-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <span className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</span>
                <span className="text-xs text-muted-foreground font-medium">{stat.sub}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border shadow-sm">
            <h3 className="text-base font-extrabold mb-4 text-center">Keyword Coverage</h3>
            <div className="h-52 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-green-500">{result.keywordMatchRate}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border shadow-sm">
            <h3 className="text-base font-extrabold mb-4 text-center">Gaps by Category</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700, fontFamily: "Plus Jakarta Sans" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 600, fontFamily: "Plus Jakarta Sans" }} width={70} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="missing" fill="#fca5a5" name="Missing" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border shadow-sm">
            <h3 className="text-base font-extrabold mb-4 text-center">Skill Radar</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 700, fontFamily: "Plus Jakarta Sans" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} />
                  <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Skill Gap Heat Map */}
        <div className="bg-white dark:bg-card p-8 rounded-3xl border border-border shadow-sm">
          <div className="mb-4">
            <h3 className="text-2xl font-extrabold text-foreground">Skill Gap Heat Map</h3>
            <p className="text-sm font-medium text-muted-foreground">Hover each card for a tip. Sorted by urgency.</p>
          </div>
          <div className="flex gap-4 mb-5 text-xs font-extrabold uppercase flex-wrap">
            {(["critical", "high", "medium", "low"] as const).map(imp => {
              const cfg = importanceConfig[imp];
              return (
                <span key={imp} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                  <span className="w-2 h-2 rounded-full bg-current" /> {imp}
                </span>
              );
            })}
          </div>
          {result.missingSkills.length === 0 ? (
            <div className="p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-green-700 dark:text-green-400">No significant skill gaps detected — great fit!</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {[...result.missingSkills].sort((a, b) => {
                const w: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
                return (w[b.importance] ?? 0) - (w[a.importance] ?? 0);
              }).map((gap, i) => {
                const cfg = importanceConfig[gap.importance] ?? importanceConfig.low;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    title={gap.tip}
                    className={`px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border} cursor-help flex flex-col gap-1 min-w-[130px] shadow-sm`}
                  >
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${cfg.text}`}>{gap.importance}</span>
                    <span className="font-bold text-sm text-foreground">{gap.name}</span>
                    <span className="text-xs text-muted-foreground">{gap.category}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Benchmark Chart */}
        <div className="bg-white dark:bg-card p-8 rounded-3xl border border-border shadow-sm">
          <h3 className="text-2xl font-extrabold text-foreground mb-6">Score vs Benchmark</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="category" tick={{ fontWeight: 700, fontSize: 12, fontFamily: "Plus Jakarta Sans" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontFamily: "Plus Jakarta Sans" }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}/100`} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {benchmarkData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matched Skills + Strengths */}
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-3xl bg-white dark:bg-card border border-border shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-400 p-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Keywords You Have
              </h3>
            </div>
            <div className="p-6 flex flex-wrap gap-2">
              {result.matchedSkills.length === 0 ? (
                <p className="text-muted-foreground text-sm">No exact matches found.</p>
              ) : result.matchedSkills.map((skill, i) => (
                <span key={i} className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl text-sm font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {skill}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="p-6 rounded-3xl bg-white dark:bg-card border border-border shadow-sm">
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2 mb-5">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Resume Strengths
            </h3>
            <div className="space-y-3">
              {result.resumeStrengths.map((str, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-3">
                  <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-primary to-accent shrink-0 leading-tight">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium text-foreground pt-0.5">{str}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ACTIONABLE IMPROVEMENTS — FULLY DYNAMIC, BOTH ADD + REMOVE
        ════════════════════════════════════════════════════════════════ */}
        <div>
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-foreground mb-1">Actionable Improvements</h2>
            <p className="text-muted-foreground font-medium">
              Every section shows <span className="font-bold text-emerald-600">what to add</span> and <span className="font-bold text-red-500">what to remove</span> — specific to your resume and this job.
            </p>
          </div>

          {result.improvementTips.length === 0 ? (
            <div className="p-8 bg-secondary/50 rounded-2xl text-center text-muted-foreground font-medium">
              No improvement tips generated. Try re-analyzing with a more detailed resume and job description.
            </div>
          ) : (
            <div className="space-y-4">
              {result.improvementTips.map((tip, i) => (
                <ImprovementCard key={i} tip={tip} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SKILLS TO LEARN — Dynamic from AI
        ════════════════════════════════════════════════════════════════ */}
        {result.skillsToLearn && result.skillsToLearn.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-foreground mb-1">Skills to Learn</h2>
              <p className="text-muted-foreground font-medium">
                Missing skills ranked by how critical they are for this specific role.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.skillsToLearn.map((skill, i) => {
                const cfg = priorityConfig[skill.priority] ?? priorityConfig.medium;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    className="bg-white dark:bg-card border border-border rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-extrabold text-base text-foreground">{skill.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium mb-2">{skill.reason}</p>
                      <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                        <Clock className="w-3 h-3" /> {skill.timeframe}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Coach Assessment */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-1 rounded-3xl bg-gradient-to-r from-primary to-accent shadow-xl shadow-primary/10"
        >
          <div className="bg-white dark:bg-card p-10 rounded-[22px] flex flex-col items-center text-center relative overflow-hidden">
            <Quote className="absolute top-6 left-6 w-20 h-20 text-primary/5 -rotate-12" />
            <TrendingUp className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-primary mb-4">Coach's Assessment</h3>
            <p className="text-xl md:text-2xl font-medium text-foreground max-w-3xl leading-relaxed z-10">
              "{result.overallFeedback}"
            </p>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => setLocation("/practice")}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
            <Dumbbell className="w-5 h-5" /> Go to Practice Arena
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => setLocation("/analyze")}
            className="px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-extrabold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5" /> Analyze Another Resume
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} onClick={copyLink}
            className="px-8 py-4 bg-white dark:bg-secondary border-2 border-border text-foreground font-extrabold rounded-xl hover:bg-secondary dark:hover:bg-muted flex items-center justify-center gap-2 shadow-sm">
            <Copy className="w-5 h-5" /> Share Results
          </motion.button>
        </div>

      </div>
    </div>
  );
}
