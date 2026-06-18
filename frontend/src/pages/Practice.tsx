import { useState, useEffect } from "react";
import type { PracticeData, PracticeQuestion } from "@/types/analysis";
import { generatePractice } from "@/services/api";
import { useAnalysis } from "@/context/AnalysisContext";
import { useTheme } from "@/context/ThemeContext";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Brain, Youtube, Code2, Server, Users, Zap, ChevronDown,
  ChevronUp, CheckCircle2, Loader2, BookOpen, Trophy, Filter, ExternalLink,
  Lightbulb, Play, Search, Moon, Sun, Download, AlertCircle,
  ShieldAlert, Target, Sparkles, BarChart2
} from "lucide-react";
import jsPDF from "jspdf";

type QuestionType = "dsa" | "system-design" | "behavioral" | "technical";
type Difficulty = "Easy" | "Medium" | "Hard";
type SourceFilter = "all" | "jd-verification" | "jd-requirement" | "resume-gap";

function downloadPDF(practiceData: PracticeData, role: string, company: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const addText = (text: string, size: number, style: "normal" | "bold" = "normal", color: [number, number, number] = [30, 30, 30]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    if (y + lines.length * (size * 0.4 + 2) > 275) { doc.addPage(); y = 20; }
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.4 + 2) + 2;
  };
  const addSpacer = (h = 6) => { y += h; };
  const addLine = () => { doc.setDrawColor(200, 200, 200); doc.line(margin, y, pageWidth - margin, y); addSpacer(5); };

  addText("Job Jugaad AI — JD-Targeted Practice Plan", 18, "bold", [79, 70, 229]);
  addText(`${role ? role + (company ? " at " + company : "") : "Role"} • Generated: ${new Date().toLocaleDateString()}`, 10, "normal", [120, 120, 120]);
  addText(`60% JD Requirements | 40% Resume Gaps | ${practiceData.verificationCount} Verification Questions`, 10, "bold", [239, 68, 68]);
  addSpacer(4); addLine();

  if (practiceData.disclaimer) {
    addText("⚠ Important", 12, "bold", [239, 68, 68]);
    addText(practiceData.disclaimer, 10, "normal", [100, 60, 60]);
    addSpacer(6); addLine();
  }

  if (practiceData.studyPlan) {
    addText("Study Plan", 13, "bold", [79, 70, 229]);
    addSpacer(2); addText(practiceData.studyPlan, 10); addSpacer(8); addLine();
  }

  const sourceOrder = ["jd-verification", "jd-requirement", "resume-gap"] as const;
  const sourceLabels = {
    "jd-verification": "JD Critical — Verify (60%)",
    "jd-requirement": "JD Required — Learn (60%)",
    "resume-gap": "Resume Gaps — Develop (40%)",
  };

  for (const src of sourceOrder) {
    const qs = practiceData.questions.filter(q => q.source === src);
    if (qs.length === 0) continue;
    addText(sourceLabels[src], 13, "bold", [79, 70, 229]);
    addLine();
    qs.forEach((q, i) => {
      addText(`${i + 1}. ${q.title} (${q.difficulty}) — ${q.category}`, 11, "bold");
      if (q.source === "jd-verification") addText(`★ VERIFICATION — Target: ${q.skillTarget} | Depth: ${q.probeDepth}`, 9, "bold", [239, 68, 68]);
      addSpacer(2); addText(q.description, 10); addSpacer(2);
      addText(`Hint: ${q.hint}`, 10, "normal", [100, 100, 100]);
      if (q.followUps.length > 0) {
        addSpacer(2); addText("Follow-ups:", 10, "bold");
        q.followUps.forEach(f => addText(`  • ${f}`, 10));
      }
      addSpacer(6);
    });
    addSpacer(4);
  }

  if (practiceData.youtubeResources.length > 0) {
    addLine(); addText("Learning Resources", 13, "bold", [79, 70, 229]); addSpacer(2);
    practiceData.youtubeResources.forEach((r, i) => {
      addText(`${i + 1}. ${r.topic} — ${r.channel}`, 11, "bold");
      addText(r.description, 10); addText(`Search: "${r.query}"`, 10, "normal", [100, 100, 100]); addSpacer(4);
    });
  }
  doc.save("jobjugaad-jd-practice-plan.pdf");
}

const SOURCE_META = {
  "jd-verification": {
    label: "JD Critical — Verify",
    shortLabel: "Verify",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-300 dark:border-red-800",
    leftBorder: "border-l-red-500",
    icon: <ShieldAlert className="w-3 h-3" />,
    tip: "This tests a skill you listed on your resume that this JD heavily requires. Be ready for deep, experience-level probing.",
  },
  "jd-requirement": {
    label: "JD Required",
    shortLabel: "JD",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-300 dark:border-orange-800",
    leftBorder: "border-l-orange-500",
    icon: <Target className="w-3 h-3" />,
    tip: "This skill is required by the JD. Study it before the interview.",
  },
  "resume-gap": {
    label: "Resume Gap",
    shortLabel: "Gap",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-800",
    leftBorder: "border-l-blue-500",
    icon: <Brain className="w-3 h-3" />,
    tip: "This skill is missing from your resume. Learn it to strengthen your candidacy.",
  },
};

const DEPTH_META = {
  expert: { label: "Expert Depth", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  deep: { label: "Deep Dive", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  surface: { label: "Conceptual", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

export default function Practice() {
  const [practiceData, setPracticeData] = useState<PracticeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<QuestionType | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set());

  const { result, jobDescription, company, role } = useAnalysis();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (result) handleGenerate();
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const missingSkillNames = result?.missingSkills.map(s => s.name) ?? [];
      const matchedSkillNames = result?.matchedSkills ?? [];
      const data = await generatePractice(
        jobDescription || "",
        missingSkillNames,
        matchedSkillNames,
        role || "Software Engineer",
        company || "",
        result?.overallFeedback ?? ""
      );
      setPracticeData(data);
      setExpandedQuestions(new Set());
      setCompletedQuestions(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate practice plan. Check your connection.");
      setPracticeData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestion = (index: number) => {
    const s = new Set(expandedQuestions);
    s.has(index) ? s.delete(index) : s.add(index);
    setExpandedQuestions(s);
  };

  const toggleComplete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const s = new Set(completedQuestions);
    s.has(index) ? s.delete(index) : s.add(index);
    setCompletedQuestions(s);
  };

  const filteredQuestions = (practiceData?.questions ?? []).filter(q => {
    if (activeTab !== "all" && q.type !== activeTab) return false;
    if (sourceFilter !== "all" && q.source !== sourceFilter) return false;
    if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
    return true;
  });

  const verifyCount = practiceData?.questions.filter(q => q.source === "jd-verification").length ?? 0;
  const jdCount = practiceData?.questions.filter(q => q.source === "jd-requirement").length ?? 0;
  const gapCount = practiceData?.questions.filter(q => q.source === "resume-gap").length ?? 0;

  const tabOptions: { id: QuestionType | "all"; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: <Filter className="w-4 h-4" /> },
    { id: "dsa", label: "DSA", icon: <Code2 className="w-4 h-4" /> },
    { id: "system-design", label: "System Design", icon: <Server className="w-4 h-4" /> },
    { id: "behavioral", label: "Behavioral", icon: <Users className="w-4 h-4" /> },
    { id: "technical", label: "Technical", icon: <Zap className="w-4 h-4" /> },
  ];

  const sourceFilterOptions: { id: SourceFilter; label: string; count: number; cls: string }[] = [
    { id: "all", label: "All Sources", count: practiceData?.questions.length ?? 0, cls: "bg-foreground text-background" },
    { id: "jd-verification", label: "Verify (JD)", count: verifyCount, cls: "bg-red-500 text-white" },
    { id: "jd-requirement", label: "JD Required", count: jdCount, cls: "bg-orange-500 text-white" },
    { id: "resume-gap", label: "Resume Gap", count: gapCount, cls: "bg-blue-500 text-white" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-card/80 backdrop-blur-md border-b border-border py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/results" className="p-2 hover:bg-secondary rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-sm block leading-tight">Job Jugaad AI</span>
                <span className="text-xs text-muted-foreground font-medium block">Practice Arena</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {practiceData && (
              <button onClick={() => downloadPDF(practiceData, role, company)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> PDF
              </button>
            )}
            <Link href="/analyze" className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity">
              New Analysis
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Hero section */}
        <section className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 md:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            <div className="flex items-start gap-5 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <Trophy className="w-7 h-7 text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">JD-Targeted Practice Arena</h1>
                  {role && <span className="text-sm px-2.5 py-1 rounded-full bg-white/10 border border-white/20 font-bold">{role}{company ? ` @ ${company}` : ""}</span>}
                </div>

                {/* 60/40 breakdown */}
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <div className="w-3 h-3 rounded bg-red-400" />
                    <span>60% JD-driven</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <div className="w-3 h-3 rounded bg-blue-400" />
                    <span>40% Gap-driven</span>
                  </div>
                  {practiceData && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
                      <ShieldAlert className="w-3 h-3" />
                      <span>{verifyCount} fake-project detection questions</span>
                    </div>
                  )}
                </div>

                {/* Progress bar showing JD vs Gap split */}
                {practiceData && (
                  <div className="mb-4">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                      <div className="h-full bg-red-400" style={{ width: `${(verifyCount / practiceData.questions.length) * 100}%` }} />
                      <div className="h-full bg-orange-400" style={{ width: `${(jdCount / practiceData.questions.length) * 100}%` }} />
                      <div className="h-full bg-blue-400" style={{ width: `${(gapCount / practiceData.questions.length) * 100}%` }} />
                    </div>
                    <div className="flex gap-4 mt-1.5 text-[10px] text-white/60 font-medium">
                      <span className="text-red-300">■ Verify ({verifyCount})</span>
                      <span className="text-orange-300">■ JD Required ({jdCount})</span>
                      <span className="text-blue-300">■ Gap ({gapCount})</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {practiceData && (
                    <>
                      <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-sm font-bold flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-blue-300" /> {practiceData.questions.length} Questions
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-sm font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-300" /> {verifyCount} Verifications
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-sm font-bold flex items-center gap-1.5">
                        <Youtube className="w-4 h-4 text-red-400" /> {practiceData.youtubeResources.length} Resources
                      </span>
                    </>
                  )}
                </div>

                {practiceData?.studyPlan && (
                  <p className="text-white/70 italic text-sm border-l-4 border-white/20 pl-4 py-1 max-w-2xl">
                    "{practiceData.studyPlan}"
                  </p>
                )}

                {error && (
                  <div className="mt-3 flex items-start gap-2 text-red-300 text-sm bg-red-900/20 border border-red-700/30 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleGenerate} disabled={isLoading}
              className="shrink-0 px-6 py-3 bg-white text-indigo-950 hover:bg-indigo-50 font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 whitespace-nowrap">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-indigo-600" />}
              {isLoading ? "Generating..." : practiceData ? "Regenerate" : "Generate Plan"}
            </button>
          </div>
        </section>

        {/* Disclaimer banner */}
        {practiceData && verifyCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Anti-Fake-Project Verification Active</p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5 font-medium">
                {practiceData.disclaimer}
              </p>
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <p className="text-lg font-bold">Generating JD-targeted practice plan…</p>
            <p className="text-sm text-muted-foreground">Analyzing JD requirements & resume claims</p>
          </div>
        )}

        {!isLoading && !practiceData && !error && (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold">No practice plan yet</p>
            <p className="text-sm text-muted-foreground">Click "Generate Plan" to create your JD-targeted practice</p>
          </div>
        )}

        {!isLoading && practiceData && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <ShieldAlert className="w-5 h-5 text-red-500" />, val: verifyCount, label: "Verify Questions", sub: "JD-claim verification", bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900" },
                { icon: <Target className="w-5 h-5 text-orange-500" />, val: jdCount, label: "JD Required", sub: "Must-know for role", bg: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900" },
                { icon: <Brain className="w-5 h-5 text-blue-500" />, val: gapCount, label: "Gap Questions", sub: "Skills to develop", bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900" },
                { icon: <BarChart2 className="w-5 h-5 text-primary" />, val: practiceData.questions.length, label: "Total Questions", sub: "Full practice set", bg: "bg-primary/5 border-primary/20" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className={`rounded-2xl border p-4 ${s.bg}`}>
                  <div className="mb-2">{s.icon}</div>
                  <p className="text-2xl font-black tabular-nums">{s.val}</p>
                  <p className="text-xs font-bold text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Filters */}
            <section className="space-y-4">
              {/* Source filter */}
              <div className="flex flex-wrap gap-2">
                {sourceFilterOptions.map(opt => (
                  <button key={opt.id} onClick={() => setSourceFilter(opt.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                      sourceFilter === opt.id
                        ? `${opt.cls} border-transparent shadow-md`
                        : "bg-white dark:bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}>
                    {opt.label} <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${sourceFilter === opt.id ? "bg-white/20" : "bg-secondary"}`}>{opt.count}</span>
                  </button>
                ))}
              </div>

              {/* Type + Difficulty filters */}
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="flex overflow-x-auto pb-1 gap-2">
                  {tabOptions.map(tab => {
                    const count = (practiceData?.questions ?? []).filter(q =>
                      (tab.id === "all" || q.type === tab.id) &&
                      (sourceFilter === "all" || q.source === sourceFilter)
                    ).length;
                    const isActive = activeTab === tab.id;
                    return (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border-2 ${isActive ? "bg-primary border-primary text-white shadow-md" : "bg-white dark:bg-card border-border hover:border-primary/50 text-muted-foreground"}`}>
                        {tab.icon} {tab.label}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? "bg-white/20" : "bg-secondary"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-card p-1 rounded-full border border-border shrink-0">
                  {(["all", "Easy", "Medium", "Hard"] as const).map(d => (
                    <button key={d} onClick={() => setDifficultyFilter(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        difficultyFilter === d
                          ? d === "Easy" ? "bg-green-500 text-white" : d === "Medium" ? "bg-yellow-500 text-white" : d === "Hard" ? "bg-red-500 text-white" : "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}>{d === "all" ? "All" : d}</button>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              {filteredQuestions.length > 0 && (
                <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border flex items-center gap-4">
                  <span className="text-sm font-bold whitespace-nowrap">
                    Progress: {filteredQuestions.filter((_, i) => completedQuestions.has(i)).length}/{filteredQuestions.length}
                  </span>
                  <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                    <motion.div className="h-full bg-green-500 rounded-full" initial={{ width: 0 }}
                      animate={{ width: `${filteredQuestions.length > 0 ? (filteredQuestions.filter((_, i) => completedQuestions.has(i)).length / filteredQuestions.length) * 100 : 0}%` }} />
                  </div>
                </div>
              )}
            </section>

            {/* Question grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredQuestions.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h3 className="text-xl font-bold mb-2">No questions match these filters</h3>
                  <p className="text-muted-foreground text-sm">Try adjusting the source or difficulty filter.</p>
                </div>
              ) : (
                filteredQuestions.map((q: PracticeQuestion, i) => {
                  const isExpanded = expandedQuestions.has(i);
                  const isCompleted = completedQuestions.has(i);
                  const srcMeta = SOURCE_META[q.source ?? "jd-requirement"];
                  const depthMeta = DEPTH_META[q.probeDepth ?? "deep"];

                  const diffColors = {
                    Easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
                    Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
                    Hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
                  };

                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => toggleQuestion(i)}
                      className={`relative cursor-pointer bg-white dark:bg-card border rounded-3xl p-6 flex flex-col border-l-4 transition-all hover:shadow-xl hover:-translate-y-0.5 ${srcMeta.leftBorder} ${isCompleted ? "opacity-70" : ""} border-border hover:border-border`}>

                      {/* Source badge + skill target */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${srcMeta.bg} ${srcMeta.text} ${srcMeta.border}`}>
                          {srcMeta.icon} {srcMeta.shortLabel}
                        </span>
                        {q.skillTarget && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground border border-border">
                            {q.skillTarget}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${depthMeta.cls}`}>
                          {depthMeta.label}
                        </span>
                      </div>

                      {/* Difficulty + Type */}
                      <div className="flex justify-between items-center mb-3">
                        <span className={`px-2.5 py-1 text-xs font-extrabold rounded-md border ${diffColors[q.difficulty]}`}>{q.difficulty}</span>
                        <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md uppercase tracking-wider">{q.type.replace("-", " ")}</span>
                      </div>

                      <h3 className="text-base font-extrabold mb-1 leading-snug">{q.title}</h3>
                      <p className="text-xs font-bold text-primary mb-3">{q.category}</p>

                      <div className={`text-muted-foreground text-sm leading-relaxed mb-4 flex-1 ${!isExpanded ? "line-clamp-3" : ""}`}>
                        {q.description}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div key="detail"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden space-y-4 mb-4">
                            <div className="h-px bg-border" />

                            {/* Source context tip */}
                            <div className={`flex items-start gap-3 p-3 rounded-xl border text-sm font-medium ${srcMeta.bg} ${srcMeta.text} ${srcMeta.border}`}>
                              {srcMeta.icon}
                              <p>{srcMeta.tip}</p>
                            </div>

                            {/* Hint */}
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
                              <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{q.hint}</p>
                            </div>

                            {/* Follow-ups */}
                            {q.followUps?.length > 0 && (
                              <div>
                                <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                                  <ChevronDown className="w-4 h-4 text-primary" /> Probing Follow-ups
                                </h4>
                                <ul className="space-y-1.5 text-sm text-muted-foreground">
                                  {q.followUps.map((f, j) => (
                                    <li key={j} className="flex items-start gap-2">
                                      <span className="text-primary mt-1 font-bold">→</span> {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Card footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                        <button onClick={(e) => toggleComplete(i, e)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCompleted ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                          <CheckCircle2 className="w-4 h-4" />
                          {isCompleted ? "Completed" : "Mark Done"}
                        </button>
                        <span className="text-sm font-bold text-muted-foreground flex items-center gap-1">
                          {isExpanded ? <><ChevronUp className="w-4 h-4" /> Collapse</> : <><ChevronDown className="w-4 h-4" /> Expand</>}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </section>

            {/* YouTube resources */}
            {practiceData.youtubeResources.length > 0 && (
              <section className="pt-8 border-t border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-xl">
                    <Youtube className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold">Learning Resources</h2>
                    <p className="text-muted-foreground text-sm font-medium">Curated for your JD requirements & skill gaps</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {practiceData.youtubeResources.map((res, i) => (
                    <motion.a key={i}
                      href={`https://youtube.com/results?search_query=${encodeURIComponent(res.query)}`}
                      target="_blank" rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                      className="group bg-white dark:bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl hover:border-red-200 dark:hover:border-red-800 transition-all hover:-translate-y-1 block">
                      <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-red-600" />
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-current" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded-md">Video</span>
                        </div>
                        <h3 className="text-base font-extrabold mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">{res.topic}</h3>
                        <p className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-3">{res.channel} <ExternalLink className="w-3 h-3" /></p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{res.description}</p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
