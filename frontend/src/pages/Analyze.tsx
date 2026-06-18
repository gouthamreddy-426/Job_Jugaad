import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { useAnalysis } from "@/context/AnalysisContext";
import { extractTextFromPdf } from "@/utils/pdfExtract";
import { analyzeResume } from "@/services/api";
import {
  UploadCloud, FileText, Briefcase, ChevronRight,
  Loader2, ScanLine, BrainCircuit, Activity,
  ArrowLeft, CheckCircle2, Type, FileUp, AlertCircle,
  Code, Award, Zap, Building, Target, FileSearch
} from "lucide-react";

function ParticleBurst({ isExploding }: { isExploding: boolean }) {
  if (!isExploding) return null;
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 2 * Math.PI;
        const x = Math.cos(angle) * 60;
        const y = Math.sin(angle) * 60;
        return (
          <motion.div key={i}
            className="absolute w-2 h-2 rounded-full bg-white z-0"
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x, y, scale: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ left: "calc(50% - 4px)", top: "calc(50% - 4px)" }}
          />
        );
      })}
    </>
  );
}

export default function Analyze() {
  const [, setLocation] = useLocation();
  const { setResult, setJobDescription, setResumeText: setCtxResumeText } = useAnalysis();

  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileData, setFileData] = useState<{ name: string; size: string; wordCount?: number } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jdFileData, setJdFileData] = useState<{ name: string; size: string; wordCount?: number } | null>(null);
  const [jdIsExtracting, setJdIsExtracting] = useState(false);
  const [showJdPasteFallback, setShowJdPasteFallback] = useState(false);
  const [jdIsDragging, setJdIsDragging] = useState(false);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { text: "Reading your resume...", icon: <FileText className="w-8 h-8" /> },
    { text: "Scanning job requirements...", icon: <ScanLine className="w-8 h-8" /> },
    { text: "Computing ATS score...", icon: <Activity className="w-8 h-8" /> },
    { text: "Generating your gap report...", icon: <BrainCircuit className="w-8 h-8" /> },
  ];

  const handleFileSelect = async (file: File) => {
    if (!file || file.type !== "application/pdf") { setError("Please upload a valid PDF file."); return; }
    setError(null);
    setFileData({ name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + " MB" });
    setIsExtracting(true);
    try {
      const text = await extractTextFromPdf(file);
      setResumeText(text);
      setFileData(prev => prev ? { ...prev, wordCount: text.split(/\s+/).length } : null);
    } catch {
      setError("Failed to extract PDF. Please try pasting the text instead.");
      setFileData(null);
      setShowPasteFallback(true);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleJdFileSelect = async (file: File) => {
    if (!file || file.type !== "application/pdf") { setError("Please upload a valid PDF for the job description."); return; }
    setError(null);
    setJdFileData({ name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + " MB" });
    setJdIsExtracting(true);
    try {
      const text = await extractTextFromPdf(file);
      setJdText(text);
      setJdFileData(prev => prev ? { ...prev, wordCount: text.split(/\s+/).length } : null);
    } catch {
      setError("Failed to extract JD PDF. Please paste the text instead.");
      setJdFileData(null);
      setShowJdPasteFallback(true);
    } finally {
      setJdIsExtracting(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); };
  const onJdDragOver = (e: React.DragEvent) => { e.preventDefault(); setJdIsDragging(true); };
  const onJdDragLeave = () => setJdIsDragging(false);
  const onJdDrop = (e: React.DragEvent) => { e.preventDefault(); setJdIsDragging(false); if (e.dataTransfer.files[0]) handleJdFileSelect(e.dataTransfer.files[0]); };

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jdText.trim()) return;
    setIsExploding(true);
    setTimeout(() => setIsExploding(false), 600);
    setIsAnalyzing(true);
    setError(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => { if (prev < steps.length - 1) return prev + 1; clearInterval(stepInterval); return prev; });
    }, 1500);

    try {
      // Always call the real API — never use mock data
      const result = await analyzeResume(resumeText, jdText, company.trim(), role.trim());
      clearInterval(stepInterval);
      setLoadingStep(steps.length - 1);
      setResult(result);
      setJobDescription(jdText);
      setCtxResumeText(resumeText);
      setTimeout(() => setLocation("/results"), 800);
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      setError(err instanceof Error ? err.message : "Failed to analyze. Please try again.");
    }
  };

  const step1Done = resumeText.length > 50;
  const step2Done = jdText.length > 50;
  const currentStep = step1Done && step2Done ? 2 : step1Done ? 1 : 0;
  const stepDone = [step1Done, step2Done, false];

  const floatingIcons = [
    { Icon: FileText, top: "15%", left: "10%" },
    { Icon: Code, top: "70%", left: "15%" },
    { Icon: Briefcase, top: "20%", right: "15%" },
    { Icon: Award, top: "60%", right: "10%" },
    { Icon: Zap, top: "80%", left: "50%" },
  ];

  const jdFloatingIcons = [
    { Icon: Briefcase, top: "15%", left: "10%" },
    { Icon: Building, top: "70%", left: "15%" },
    { Icon: Target, top: "20%", right: "15%" },
    { Icon: FileSearch, top: "60%", right: "10%" },
    { Icon: Zap, top: "80%", left: "50%" },
  ];

  return (
    <div className="min-h-screen font-sans relative"
      style={{
        backgroundColor: "hsl(var(--background))",
        backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-border py-4">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-bold group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="flex items-center gap-0">
            {["Upload Resume", "Job Description", "Analyze"].map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  stepDone[i] ? "bg-primary border-primary text-white" :
                  i === currentStep ? "border-primary text-primary bg-primary/10" :
                  "border-border text-muted-foreground"
                }`}>{stepDone[i] ? "✓" : i + 1}</div>
                {i < 2 && <div className={`h-0.5 w-12 sm:w-16 transition-all ${stepDone[i] ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 pb-24">
        {error && !isAnalyzing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div><h4 className="font-bold">Error</h4><p className="text-sm font-medium">{error}</p></div>
          </motion.div>
        )}

        <div className="space-y-12">
          {/* Step 1 — Resume */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold flex items-center gap-2 text-foreground">
                {step1Done && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                Step 1: Your Resume
              </h2>
            </div>
            {!fileData && !showPasteFallback ? (
              <div
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-80 relative border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ${
                  isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border bg-white dark:bg-card hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {floatingIcons.map((item, i) => (
                  <motion.div key={i} className="absolute text-muted-foreground opacity-10"
                    style={{ top: item.top, left: (item as { left?: string }).left, right: (item as { right?: string }).right }}
                    animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 3 + i, delay: i * 0.7 }}>
                    <item.Icon className="w-16 h-16" />
                  </motion.div>
                ))}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`p-4 rounded-2xl mb-4 transition-colors ${isDragging ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">Drop your resume PDF here</h3>
                  <p className="text-muted-foreground font-medium mb-4">or click to browse files</p>
                  <button onClick={(e) => { e.stopPropagation(); setShowPasteFallback(true); }}
                    className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                    <Type className="w-4 h-4" /> Paste text instead
                  </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} accept="application/pdf" className="hidden" />
              </div>
            ) : fileData ? (
              <div className="w-full p-8 bg-white dark:bg-card border border-border rounded-3xl flex flex-col gap-4 shadow-sm border-l-8 border-l-green-500">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 shrink-0">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground truncate">{fileData.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold text-muted-foreground">{fileData.size}</span>
                      {isExtracting ? (
                        <span className="text-sm font-bold text-primary flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-md">
                          <Loader2 className="w-3 h-3 animate-spin" /> Extracting text...
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-green-600 flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Extracted {fileData.wordCount ?? 0} words
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => { setFileData(null); setResumeText(""); setShowPasteFallback(false); }}
                    className="px-4 py-2 border border-border rounded-xl text-sm font-bold text-foreground hover:bg-secondary transition-colors">
                    Swap file
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-card rounded-3xl border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <div className="bg-secondary px-4 py-3 border-b border-border flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground">Paste Resume Text</span>
                  <button onClick={() => setShowPasteFallback(false)} className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                    <FileUp className="w-4 h-4" /> Upload PDF instead
                  </button>
                </div>
                <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your full resume text here..."
                  className="w-full h-64 p-6 outline-none resize-y text-base font-medium bg-transparent text-foreground" />
              </div>
            )}
          </section>

          {/* Step 2 — Job Description */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold flex items-center gap-2 text-foreground">
                {step2Done && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                Step 2: Job Description
              </h2>
            </div>

            {/* Optional: Company + Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name (optional)"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-card border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text" value={role} onChange={(e) => setRole(e.target.value)}
                  placeholder="Role / job title (optional)"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-card border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {!jdFileData && !showJdPasteFallback ? (
              <div
                onDragOver={onJdDragOver} onDragLeave={onJdDragLeave} onDrop={onJdDrop}
                onClick={() => jdFileInputRef.current?.click()}
                className={`w-full h-80 relative border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ${
                  jdIsDragging ? "border-accent bg-accent/5 scale-[1.02]" : "border-border bg-white dark:bg-card hover:border-accent/50 hover:bg-accent/5"
                }`}
              >
                {jdFloatingIcons.map((item, i) => (
                  <motion.div key={i} className="absolute text-muted-foreground opacity-10"
                    style={{ top: item.top, left: (item as { left?: string }).left, right: (item as { right?: string }).right }}
                    animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 3 + i, delay: i * 0.7 }}>
                    <item.Icon className="w-16 h-16" />
                  </motion.div>
                ))}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`p-4 rounded-2xl mb-4 transition-colors ${jdIsDragging ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">Drop job description PDF here</h3>
                  <p className="text-muted-foreground font-medium mb-4">or click to browse files</p>
                  <button onClick={(e) => { e.stopPropagation(); setShowJdPasteFallback(true); }}
                    className="text-accent text-sm font-bold hover:underline flex items-center gap-1">
                    <Type className="w-4 h-4" /> Paste text instead
                  </button>
                </div>
                <input type="file" ref={jdFileInputRef} onChange={(e) => e.target.files && handleJdFileSelect(e.target.files[0])} accept="application/pdf" className="hidden" />
              </div>
            ) : jdFileData ? (
              <div className="w-full p-8 bg-white dark:bg-card border border-border rounded-3xl flex flex-col gap-4 shadow-sm border-l-8 border-l-green-500">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 shrink-0">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground truncate">{jdFileData.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold text-muted-foreground">{jdFileData.size}</span>
                      {jdIsExtracting ? (
                        <span className="text-sm font-bold text-accent flex items-center gap-1.5 bg-accent/10 px-2 py-0.5 rounded-md">
                          <Loader2 className="w-3 h-3 animate-spin" /> Extracting text...
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-green-600 flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Extracted {jdFileData.wordCount ?? 0} words
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => { setJdFileData(null); setJdText(""); setShowJdPasteFallback(false); }}
                    className="px-4 py-2 border border-border rounded-xl text-sm font-bold text-foreground hover:bg-secondary transition-colors">
                    Swap file
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-card rounded-3xl border border-border overflow-hidden focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all shadow-sm relative">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-accent" />
                <div className="bg-secondary px-4 py-3 border-b border-border flex justify-between items-center mt-[3px]">
                  <span className="text-sm font-bold text-muted-foreground">Paste Job Description</span>
                  <button onClick={() => setShowJdPasteFallback(false)} className="text-accent text-sm font-bold hover:underline flex items-center gap-1">
                    <FileUp className="w-4 h-4" /> Upload PDF instead
                  </button>
                </div>
                <textarea value={jdText} onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full h-64 p-6 outline-none resize-y text-base font-medium bg-transparent text-foreground" />
                <div className="absolute bottom-4 right-4 pointer-events-none">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold text-white transition-colors ${jdText.length > 500 ? "bg-green-500" : jdText.length > 100 ? "bg-yellow-500" : "bg-gray-400"}`}>
                    {jdText.length} chars
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Analyze Button */}
          <section className="pt-6">
            <button
              onClick={handleAnalyze}
              disabled={!step1Done || !step2Done || isAnalyzing}
              className="w-full group relative py-6 bg-gradient-to-r from-primary to-accent text-white font-extrabold text-2xl rounded-3xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0"
            >
              <AnimatePresence>
                {isExploding && <ParticleBurst isExploding={isExploding} />}
              </AnimatePresence>
              <span className="relative z-10 flex items-center justify-center gap-3">
                Analyze My Resume <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </span>
            </button>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/60 dark:bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center p-4">
            <div className="relative">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-primary via-accent to-primary opacity-30 blur-sm pointer-events-none" />
              <div className="w-full max-w-md bg-white dark:bg-card rounded-3xl shadow-2xl border border-border p-8 relative z-10">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-secondary">
                  <motion.div className="h-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5 }} />
                </div>
                <div className="space-y-8 mt-4">
                  {steps.map((step, idx) => {
                    const isActive = idx === loadingStep;
                    const isPast = idx < loadingStep;
                    return (
                      <div key={idx} className={`flex items-center gap-4 transition-all duration-300 ${isActive ? "opacity-100 scale-105 origin-left" : isPast ? "opacity-50" : "opacity-30"}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-primary/10 text-primary" : isPast ? "bg-green-50 dark:bg-green-900/20 text-green-500" : "bg-secondary text-muted-foreground"}`}>
                          {isPast ? <CheckCircle2 className="w-6 h-6" /> : isActive ? <Loader2 className="w-6 h-6 animate-spin" /> : step.icon}
                        </div>
                        <span className={`font-bold text-lg ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{step.text}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-10 pt-6 border-t border-border text-center">
                  <p className="text-sm font-bold text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Powered by Groq AI — ~15 seconds
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
