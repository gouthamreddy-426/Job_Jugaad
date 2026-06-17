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
  Lightbulb, Play, Search, Moon, Sun, Download, AlertCircle
} from "lucide-react";
import jsPDF from "jspdf";

type QuestionType = "dsa" | "system-design" | "behavioral" | "technical";
type Difficulty = "Easy" | "Medium" | "Hard";

function downloadPDF(practiceData: PracticeData) {
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
    if (y + lines.length * (size * 0.4 + 2) > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.4 + 2) + 2;
  };

  const addSpacer = (h = 6) => { y += h; };
  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    addSpacer(5);
  };

  addText("Job Jugaad AI — Personalized Practice Plan", 18, "bold", [79, 70, 229]);
  addText(`Generated: ${new Date().toLocaleDateString()}`, 10, "normal", [120, 120, 120]);
  addSpacer(4);
  addLine();

  if (practiceData.studyPlan) {
    addText("Study Plan", 13, "bold", [79, 70, 229]);
    addSpacer(2);
    addText(practiceData.studyPlan, 10);
    addSpacer(8);
    addLine();
  }

  const typeOrder: QuestionType[] = ["dsa", "system-design", "behavioral", "technical"];
  const typeLabels: Record<QuestionType, string> = {
    dsa: "DSA (Data Structures & Algorithms)",
    "system-design": "System Design",
    behavioral: "Behavioral",
    technical: "Technical Concepts",
  };

  for (const type of typeOrder) {
    const questions = practiceData.questions.filter(q => q.type === type);
    if (questions.length === 0) continue;

    addText(typeLabels[type], 13, "bold", [79, 70, 229]);
    addLine();

    questions.forEach((q, i) => {
      addText(`${i + 1}. ${q.title} (${q.difficulty}) — ${q.category}`, 11, "bold");
      addSpacer(2);
      addText(q.description, 10);
      addSpacer(2);
      addText(`Hint: ${q.hint}`, 10, "normal", [100, 100, 100]);
      if (q.followUps.length > 0) {
        addSpacer(2);
        addText("Follow-ups:", 10, "bold");
        q.followUps.forEach(f => addText(`  • ${f}`, 10));
      }
      addSpacer(6);
    });
    addSpacer(4);
  }

  if (practiceData.youtubeResources.length > 0) {
    addLine();
    addText("Recommended Learning Resources", 13, "bold", [79, 70, 229]);
    addSpacer(2);
    practiceData.youtubeResources.forEach((r, i) => {
      addText(`${i + 1}. ${r.topic} — ${r.channel}`, 11, "bold");
      addText(r.description, 10);
      addText(`Search: "${r.query}"`, 10, "normal", [100, 100, 100]);
      addSpacer(4);
    });
  }

  doc.save("jobjugaad-practice-plan.pdf");
}

export default function Practice() {
  const [practiceData, setPracticeData] = useState<PracticeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<QuestionType | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set());

  const { result, jobDescription } = useAnalysis();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (result) {
      handleGenerate();
    }
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const missingSkillNames = result?.missingSkills.map(s => s.name) ?? [];
      const data = await generatePractice(
        jobDescription || result?.overallFeedback || "",
        missingSkillNames,
        "Software Engineer",
        result?.overallFeedback ?? ""
      );
      setPracticeData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate practice plan. Check your backend connection.");
      setPracticeData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestion = (index: number) => {
    const newSet = new Set(expandedQuestions);
    if (newSet.has(index)) newSet.delete(index); else newSet.add(index);
    setExpandedQuestions(newSet);
  };

  const toggleComplete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(completedQuestions);
    if (newSet.has(index)) newSet.delete(index); else newSet.add(index);
    setCompletedQuestions(newSet);
  };

  const filteredQuestions = practiceData?.questions.filter(q => {
    if (activeTab !== "all" && q.type !== activeTab) return false;
    if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
    return true;
  }) ?? [];

  const tabOptions: { id: QuestionType | "all"; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: <Filter className="w-4 h-4" /> },
    { id: "dsa", label: "DSA", icon: <Code2 className="w-4 h-4" /> },
    { id: "system-design", label: "System Design", icon: <Server className="w-4 h-4" /> },
    { id: "behavioral", label: "Behavioral", icon: <Users className="w-4 h-4" /> },
    { id: "technical", label: "Technical", icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-card/80 backdrop-blur-md border-b border-border py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/results" className="p-2 hover:bg-secondary rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-sm block leading-tight">Job Jugaad AI</span>
                <span className="text-xs text-muted-foreground font-medium block">Practice Arena</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {practiceData && (
              <button onClick={() => downloadPDF(practiceData)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
            <Link href="/analyze" className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95">
              New Analysis
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="w-full bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Your Personalized Practice Plan</h1>
                <p className="text-white/80 font-medium text-lg mb-4">
                  {result ? "Fully customized from your gap analysis & job description" : "General software engineering prep"}
                </p>
                {result && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {result.missingSkills.slice(0, 5).map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-bold">{s.name}</span>
                    ))}
                    {result.missingSkills.length > 5 && (
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-bold">+{result.missingSkills.length - 5} more</span>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-sm font-bold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-300" /> {practiceData?.questions.length ?? "—"} Questions
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-sm font-bold flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-400" /> {practiceData?.youtubeResources.length ?? "—"} Resources
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-sm font-bold flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-300" /> 4 Categories
                  </span>
                </div>
                {practiceData?.studyPlan && (
                  <p className="text-white/70 italic text-sm border-l-4 border-white/20 pl-4 py-1 max-w-2xl">"{practiceData.studyPlan}"</p>
                )}
                {error && (
                  <div className="mt-3 flex items-start gap-2 text-red-300 text-sm font-medium bg-red-900/20 border border-red-700/30 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <button onClick={handleGenerate} disabled={isLoading}
                className="w-full md:w-auto px-6 py-3 bg-white text-indigo-950 hover:bg-indigo-50 font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-indigo-600" />}
                {isLoading ? "Generating..." : practiceData ? "Regenerate Plan" : "Generate AI Questions"}
              </button>
            </div>
          </div>
        </section>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <p className="text-lg font-bold text-foreground">Generating your personalized practice plan...</p>
            <p className="text-sm text-muted-foreground">Tailoring questions to your skill gaps</p>
          </div>
        )}

        {!isLoading && !practiceData && !error && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground">No practice plan yet</p>
            <p className="text-sm text-muted-foreground">Click "Generate AI Questions" to create your personalized plan</p>
          </div>
        )}

        {!isLoading && practiceData && (
          <>
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex overflow-x-auto pb-2 gap-2">
                  {tabOptions.map(tab => {
                    const count = practiceData.questions.filter(q => tab.id === "all" || q.type === tab.id).length;
                    const isActive = activeTab === tab.id;
                    return (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border-2 ${isActive ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white dark:bg-card border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"}`}>
                        {tab.icon} {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? "bg-white/20" : "bg-secondary dark:bg-muted"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-card p-1.5 rounded-full border border-border shadow-sm shrink-0">
                  {(["all", "Easy", "Medium", "Hard"] as const).map(d => (
                    <button key={d} onClick={() => setDifficultyFilter(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        difficultyFilter === d
                          ? d === "Easy" ? "bg-green-100 text-green-700" : d === "Medium" ? "bg-yellow-100 text-yellow-700" : d === "Hard" ? "bg-red-100 text-red-700" : "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}>{d === "all" ? "All" : d}</button>
                  ))}
                </div>
              </div>
              {filteredQuestions.length > 0 && (
                <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border flex items-center gap-4 shadow-sm">
                  <span className="text-sm font-bold whitespace-nowrap">
                    Progress: {filteredQuestions.filter((_, i) => completedQuestions.has(i)).length} of {filteredQuestions.length} completed
                  </span>
                  <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                    <motion.div className="h-full bg-green-500" initial={{ width: 0 }}
                      animate={{ width: `${(filteredQuestions.filter((_, i) => completedQuestions.has(i)).length / filteredQuestions.length) * 100}%` }} />
                  </div>
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredQuestions.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">No questions found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters.</p>
                </div>
              ) : (
                filteredQuestions.map((q: PracticeQuestion, i) => {
                  const isExpanded = expandedQuestions.has(i);
                  const isCompleted = completedQuestions.has(i);
                  const diffColors: Record<Difficulty, string> = {
                    Easy: "bg-green-100 text-green-700 border-green-200",
                    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
                    Hard: "bg-red-100 text-red-700 border-red-200",
                  };
                  const typeColors: Record<QuestionType, string> = {
                    dsa: "border-blue-500",
                    "system-design": "border-purple-500",
                    behavioral: "border-orange-500",
                    technical: "border-cyan-500",
                  };
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                      onClick={() => toggleQuestion(i)}
                      className={`relative overflow-hidden cursor-pointer bg-white dark:bg-card border rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col border-l-4 ${typeColors[q.type]} ${isCompleted ? "border-green-200 dark:border-green-800" : "border-border hover:border-primary/30"}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider rounded-md border ${diffColors[q.difficulty]}`}>{q.difficulty}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-secondary px-2.5 py-1 rounded-md">{q.type.replace("-", " ")}</span>
                      </div>
                      <h3 className="text-xl font-extrabold mb-1 pr-8 leading-tight">{q.title}</h3>
                      <p className="text-sm font-bold text-primary mb-4">{q.category}</p>
                      <div className={`text-muted-foreground font-medium text-sm leading-relaxed mb-6 flex-1 ${!isExpanded ? "line-clamp-3" : ""}`}>{q.description}</div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 mb-6 overflow-hidden">
                            <div className="w-full h-px bg-border" />
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
                              <Lightbulb className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{q.hint}</p>
                            </div>
                            {q.followUps.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-bold text-foreground">Follow-up Questions:</h4>
                                <ul className="space-y-1 text-sm font-medium text-muted-foreground">
                                  {q.followUps.map((f, j) => (<li key={j} className="flex items-start gap-2"><span className="text-primary mt-1">•</span> {f}</li>))}
                                </ul>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                        <button onClick={(e) => toggleComplete(i, e)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCompleted ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                          <CheckCircle2 className="w-4 h-4" /> {isCompleted ? "Completed" : "Mark Complete"}
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

            {practiceData.youtubeResources.length > 0 && (
              <section className="pt-10 border-t border-border">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-xl">
                    <Youtube className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold">Learning Resources</h2>
                    <p className="text-muted-foreground font-medium">Curated videos for your specific skill gaps</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {practiceData.youtubeResources.map((res, i) => (
                    <motion.a key={i} href={`https://youtube.com/results?search_query=${encodeURIComponent(res.query)}`}
                      target="_blank" rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                      className="group bg-white dark:bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl hover:border-red-200 transition-all hover:-translate-y-1 block">
                      <div className="h-2 w-full bg-gradient-to-r from-red-500 to-red-600" />
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-current" />
                          </div>
                          <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded-md">Video Lesson</span>
                        </div>
                        <h3 className="text-lg font-extrabold mb-2 group-hover:text-red-600 transition-colors line-clamp-1">{res.topic}</h3>
                        <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 mb-4">{res.channel} <ExternalLink className="w-3 h-3" /></p>
                        <p className="text-sm font-medium text-muted-foreground line-clamp-2">{res.description}</p>
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
