import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { getUserAnalyses } from "@/services/api";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Zap, ArrowLeft, BarChart2, Target, TrendingUp, FileText,
  Briefcase, Clock, ChevronRight, AlertCircle, Sparkles,
  Trophy, Brain, Rocket, RefreshCw, Eye, Star, Plus
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

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

function ScoreRing({ score, size = 100, stroke = 8, color, label, delay = 0 }: {
  score: number; size?: number; stroke?: number; color: string; label: string; delay?: number;
}) {
  const circleRef = useRef<SVGCircleElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    if (!circleRef.current || !textRef.current || !wrapRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: wrapRef.current, start: "top 85%", once: true },
      });
      tl.fromTo(circleRef.current,
        { strokeDashoffset: circ },
        { strokeDashoffset: circ * (1 - score / 100), duration: 1.6, ease: "power3.out", delay }
      );
      tl.fromTo({ val: 0 }, { val: score },
        {
          val: score, duration: 1.5, ease: "power3.out", delay: -1.5,
          onUpdate: function () {
            if (textRef.current) textRef.current.textContent = String(Math.round(this.targets()[0].val));
          }
        }
      );
    });
    return () => ctx.revert();
  }, [score, circ, delay]);

  return (
    <div ref={wrapRef} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <circle
            ref={circleRef}
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span ref={textRef} className="text-2xl font-black text-white">0</span>
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">%</span>
        </div>
      </div>
      <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{label}</span>
    </div>
  );
}

const MOCK: AnalysisRecord[] = [
  {
    id: "demo-1", atsScore: 82, keywordMatchRate: 74, company: "Google", role: "Frontend Engineer",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    matchedSkills: ["React", "TypeScript", "Node.js", "GraphQL", "CSS"],
    missingSkills: [{ name: "Kubernetes", importance: "high" }, { name: "Go", importance: "medium" }],
    overallFeedback: "Strong candidate with modern stack. Add system design examples and Kubernetes experience to push past 90.",
    industryBenchmark: 78, resumeStrengths: ["Clear formatting", "Quantified impact", "Modern stack"],
  },
  {
    id: "demo-2", atsScore: 67, keywordMatchRate: 55, company: "Stripe", role: "Full Stack Developer",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    matchedSkills: ["Python", "Django", "PostgreSQL", "REST API"],
    missingSkills: [{ name: "Ruby", importance: "critical" }, { name: "Payments domain", importance: "high" }],
    overallFeedback: "Solid backend skills but lacking payments domain knowledge. Study Stripe APIs before the interview.",
    industryBenchmark: 72, resumeStrengths: ["Backend expertise", "Database optimization"],
  },
];

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function scoreColor(s: number) {
  if (s >= 80) return "#22d3ee";
  if (s >= 60) return "#a78bfa";
  return "#f472b6";
}
function scoreLabel(s: number) {
  if (s >= 80) return { text: "Strong Match", cls: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" };
  if (s >= 60) return { text: "Moderate", cls: "bg-violet-500/20 text-violet-300 border border-violet-500/30" };
  return { text: "Needs Work", cls: "bg-pink-500/20 text-pink-300 border border-pink-500/30" };
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statsRowRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    getUserAnalyses(user.id)
      .then((data) => setAnalyses(Array.isArray(data) && data.length ? data : MOCK))
      .catch(() => setAnalyses(MOCK))
      .finally(() => setFetching(false));
  }, [user]);

  useEffect(() => {
    if (fetching) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      gsap.fromTo(bgRef.current,
        { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" }
      );

      tl.fromTo(titleRef.current,
        { y: 60, opacity: 0, scale: 0.92 },
        { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "expo.out" }
      )
      .fromTo(subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, "-=0.5"
      )
      .fromTo(".dash-stat-card",
        { y: 50, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.3"
      )
      .fromTo(".analysis-card",
        { y: 40, opacity: 0, rotateX: -8 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.65, stagger: 0.12, ease: "power4.out" }, "-=0.3"
      );

      gsap.to(".dash-orb-1", {
        x: 40, y: -30, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut"
      });
      gsap.to(".dash-orb-2", {
        x: -30, y: 40, duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2
      });
      gsap.to(".dash-orb-3", {
        x: 20, y: 20, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 4
      });
    });
    return () => ctx.revert();
  }, [fetching]);

  const avg = analyses.length
    ? Math.round(analyses.reduce((a, b) => a + b.atsScore, 0) / analyses.length)
    : 0;
  const best = analyses.length ? Math.max(...analyses.map((a) => a.atsScore)) : 0;
  const kwAvg = analyses.length
    ? Math.round(analyses.reduce((a, b) => a + b.keywordMatchRate, 0) / analyses.length)
    : 0;

  const handleCardHover = (el: HTMLDivElement | null, enter: boolean) => {
    if (!el) return;
    gsap.to(el, {
      y: enter ? -6 : 0,
      scale: enter ? 1.01 : 1,
      boxShadow: enter
        ? "0 24px 60px rgba(139,92,246,0.25)"
        : "0 4px 20px rgba(0,0,0,0.2)",
      duration: 0.35,
      ease: "power2.out",
    });
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
          </div>
          <p className="text-white/50 text-sm font-medium tracking-widest uppercase">Loading Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden font-sans" ref={heroRef}>
      <div ref={bgRef} className="fixed inset-0 pointer-events-none z-0">
        <div className="dash-orb-1 absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="dash-orb-2 absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[100px]" />
        <div className="dash-orb-3 absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/analyze"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30"
            >
              <Plus className="w-4 h-4" />
              New Analysis
            </Link>
          </div>
        </div>

        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" />
            Your AI Dashboard
          </div>
          <h1 ref={titleRef} className="text-5xl sm:text-6xl font-black mb-4 leading-tight tracking-tight"
            style={{
              background: "linear-gradient(135deg, #fff 0%, #a78bfa 50%, #22d3ee 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}
          >
            Career Intel
          </h1>
          <p ref={subtitleRef} className="text-white/50 text-lg font-medium max-w-xl mx-auto">
            Track every score, spot every gap, land every role.
          </p>
        </div>

        <div ref={statsRowRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { icon: <BarChart2 className="w-5 h-5" />, label: "Avg ATS Score", val: `${avg}%`, color: "violet", sub: "across all scans" },
            { icon: <Trophy className="w-5 h-5" />, label: "Best Score", val: `${best}%`, color: "cyan", sub: "personal record" },
            { icon: <Target className="w-5 h-5" />, label: "Avg Match Rate", val: `${kwAvg}%`, color: "pink", sub: "keyword coverage" },
            { icon: <Brain className="w-5 h-5" />, label: "Total Scans", val: String(analyses.length), color: "amber", sub: "analyses done" },
          ].map((s, i) => (
            <div key={i} className={`dash-stat-card group relative overflow-hidden rounded-2xl p-5 border cursor-default
              ${s.color === "violet" ? "bg-violet-500/10 border-violet-500/20 hover:border-violet-400/50" :
                s.color === "cyan" ? "bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-400/50" :
                s.color === "pink" ? "bg-pink-500/10 border-pink-500/20 hover:border-pink-400/50" :
                "bg-amber-500/10 border-amber-500/20 hover:border-amber-400/50"}
              transition-all duration-300`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
                ${s.color === "violet" ? "bg-violet-500/20 text-violet-400" :
                  s.color === "cyan" ? "bg-cyan-500/20 text-cyan-400" :
                  s.color === "pink" ? "bg-pink-500/20 text-pink-400" :
                  "bg-amber-500/20 text-amber-400"}`}
              >
                {s.icon}
              </div>
              <p className="text-3xl font-black text-white mb-1 tabular-nums">{s.val}</p>
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{s.label}</p>
              <p className="text-xs text-white/30 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            Analysis History
          </h2>
          <span className="text-xs text-white/30 font-medium">{analyses.length} scan{analyses.length !== 1 ? "s" : ""}</span>
        </div>

        <div ref={cardsRef} className="space-y-4">
          {analyses.map((a, i) => {
            const lbl = scoreLabel(a.atsScore);
            const col = scoreColor(a.atsScore);
            const isOpen = expanded === a.id;
            return (
              <div
                key={a.id}
                className="analysis-card group rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden"
                style={{ perspective: 1000 }}
                onMouseEnter={(e) => handleCardHover(e.currentTarget as HTMLDivElement, true)}
                onMouseLeave={(e) => handleCardHover(e.currentTarget as HTMLDivElement, false)}
              >
                <div
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                >
                  <div className="flex-shrink-0">
                    <ScoreRing score={a.atsScore} size={84} stroke={7} color={col} label="ATS" delay={i * 0.15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-lg font-black text-white truncate">{a.role || "Resume Analysis"}</span>
                      {a.company && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-semibold">{a.company}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${lbl.cls}`}>{lbl.text}</span>
                    </div>
                    <p className="text-sm text-white/40 font-medium line-clamp-2 mb-2">{a.overallFeedback}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {a.matchedSkills.slice(0, 5).map((sk) => (
                        <span key={sk} className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                          {sk}
                        </span>
                      ))}
                      {a.matchedSkills.length > 5 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-white/40 border border-white/10 font-semibold">
                          +{a.matchedSkills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-3 sm:items-center">
                    <div className="text-center">
                      <p className="text-2xl font-black text-white tabular-nums">{a.keywordMatchRate}%</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Keywords</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{timeAgo(a.createdAt)}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 text-white/40 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-6 border-t border-white/5 pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Strengths
                      </h4>
                      <ul className="space-y-1.5">
                        {a.resumeStrengths?.map((s) => (
                          <li key={s} className="text-sm text-white/60 flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">✓</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-pink-400 mb-3 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Missing Skills
                      </h4>
                      <ul className="space-y-1.5">
                        {a.missingSkills?.slice(0, 4).map((sk) => (
                          <li key={sk.name} className="text-sm text-white/60 flex items-center justify-between">
                            <span>{sk.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              sk.importance === "critical" ? "bg-red-500/20 text-red-400" :
                              sk.importance === "high" ? "bg-orange-500/20 text-orange-400" :
                              "bg-yellow-500/20 text-yellow-400"
                            }`}>{sk.importance}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Benchmark
                      </h4>
                      <div className="relative h-2 bg-white/10 rounded-full mb-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                          style={{ width: `${a.atsScore}%` }}
                        />
                        <div
                          className="absolute top-0 h-full w-0.5 bg-pink-400"
                          style={{ left: `${a.industryBenchmark}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-white/40">
                        <span>You: <strong className="text-white">{a.atsScore}%</strong></span>
                        <span>Benchmark: <strong className="text-pink-400">{a.industryBenchmark}%</strong></span>
                      </div>
                      <Link
                        href="/analyze"
                        className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-gradient-to-r from-violet-600/80 to-cyan-500/80 text-white text-xs font-bold hover:opacity-90 transition-opacity"
                      >
                        <Rocket className="w-3 h-3" /> Re-analyze
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!analyses.length && !fetching && (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">No analyses yet</h3>
            <p className="text-white/40 text-sm mb-6">Run your first AI analysis to see results here</p>
            <Link href="/analyze"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold hover:opacity-90 transition-opacity"
            >
              <Zap className="w-4 h-4" /> Analyze Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
