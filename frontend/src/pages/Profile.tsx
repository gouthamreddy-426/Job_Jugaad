import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  User, Mail, Calendar, LogOut, ArrowLeft,
  CheckCircle2, Zap, BarChart2, FileText,
  Edit3, Save, X, Shield, Sparkles, Trophy
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function getAvatarGradient(email: string) {
  const grads = [
    ["#7c3aed", "#ec4899"], ["#2563eb", "#06b6d4"],
    ["#059669", "#0d9488"], ["#d97706", "#dc2626"],
    ["#4f46e5", "#7c3aed"],
  ];
  return grads[email.charCodeAt(0) % grads.length];
}

function getInitials(name: string, email: string) {
  if (name?.trim()) {
    const p = name.trim().split(" ");
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function Profile() {
  const { user, signOut, } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.name ?? user?.user_metadata?.full_name ?? ""
  );
  const [editName, setEditName] = useState(displayName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      gsap.fromTo(orbsRef.current?.children ?? [],
        { opacity: 0 }, { opacity: 1, duration: 1.5, stagger: 0.3, ease: "power2.out" }
      );

      tl.fromTo(".profile-nav",
        { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }
      )
      .fromTo(heroCardRef.current,
        { y: 60, opacity: 0, rotateX: -10, scale: 0.95 },
        { y: 0, opacity: 1, rotateX: 0, scale: 1, duration: 1.1 }, "-=0.3"
      )
      .fromTo(avatarRef.current,
        { scale: 0, rotate: -180 },
        { scale: 1, rotate: 0, duration: 0.9, ease: "back.out(2)" }, "-=0.5"
      )
      .fromTo(ringRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }, "-=0.6"
      )
      .fromTo(".profile-info-card",
        { y: 30, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.4)" }, "-=0.4"
      )
      .fromTo(".profile-action-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 }, "-=0.3"
      );

      gsap.to(".profile-orb-1", { x: 50, y: -40, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".profile-orb-2", { x: -40, y: 50, duration: 12, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 3 });
      gsap.to(".profile-orb-3", { x: 30, y: 30, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 5 });

      gsap.to(ringRef.current, {
        rotate: 360, duration: 20, repeat: -1, ease: "none"
      });

      const cards = gsap.utils.toArray<HTMLElement>(".profile-info-card");
      cards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, { y: -5, scale: 1.02, duration: 0.3, ease: "power2.out" });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { y: 0, scale: 1, duration: 0.3, ease: "power2.out" });
        });
      });

      ScrollTrigger.batch(".profile-action-card", {
        start: "top 90%",
        onEnter: (batch) => gsap.fromTo(batch,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: "back.out(1.4)" }
        ),
        once: true,
      });
    }, containerRef);

    return () => ctx.revert();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 mb-4 font-medium">You need to be signed in.</p>
          <Link href="/login" className="px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const email = user.email ?? "";
  const [grad1, grad2] = getAvatarGradient(email);
  const initials = getInitials(displayName, email);
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Unknown";
  const provider = user.app_metadata?.provider ?? "email";

  const handleSaveName = async () => {
    if (!editName.trim() || editName === displayName) { setIsEditingName(false); return; }
    setNameLoading(true);
    const { error } = await supabase.auth.updateUser({ data: { name: editName.trim() } });
    setNameLoading(false);
    if (!error) {
      setDisplayName(editName.trim());
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    }
    setIsEditingName(false);
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    await signOut();
    setLocation("/");
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden font-sans">
      <div ref={orbsRef} className="fixed inset-0 pointer-events-none z-0">
        <div className="profile-orb-1 absolute top-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[140px]"
          style={{ background: `radial-gradient(circle, ${grad1}33, transparent)` }} />
        <div className="profile-orb-2 absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${grad2}2a, transparent)` }} />
        <div className="profile-orb-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] bg-violet-600/10" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <nav className="profile-nav relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5 backdrop-blur-md bg-white/[0.02]">
        <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${grad1}, ${grad2})` }}>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-sm">Job Jugaad AI</span>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">

        <div ref={heroCardRef} className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden mb-6">
          <div className="h-32 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${grad1}66, ${grad2}44)` }}>
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />
            <div className="absolute top-3 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Trophy className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-bold text-white">Pro Member</span>
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className="relative -mt-14 mb-6 w-fit">
              <div className="relative" style={{ width: 96, height: 96 }}>
                <div ref={ringRef}
                  className="absolute -inset-2 rounded-3xl border-2 border-dashed opacity-60"
                  style={{ borderColor: grad1 }}
                />
                <div ref={avatarRef}
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-2xl border-2 border-white/10 select-none relative z-10"
                  style={{ background: `linear-gradient(135deg, ${grad1}, ${grad2})` }}
                >
                  {initials}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#0a0a0f] z-20 animate-pulse" />
            </div>

            <div className="flex items-center gap-3 mb-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setIsEditingName(false); }}
                    className="text-2xl font-black bg-white/5 border border-white/20 rounded-xl px-3 py-1 outline-none focus:border-violet-500/50 text-white w-52"
                  />
                  <button onClick={handleSaveName} disabled={nameLoading}
                    className="p-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                    style={{ background: `linear-gradient(135deg, ${grad1}, ${grad2})` }}>
                    {nameLoading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Save className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setIsEditingName(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white">{displayName || "No name set"}</h1>
                  <button onClick={() => { setEditName(displayName); setIsEditingName(true); }}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {nameSaved && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium mb-2">
                <CheckCircle2 className="w-4 h-4" /> Name saved!
              </div>
            )}
            <p className="text-white/40 text-sm flex items-center gap-1.5 font-medium">
              <Sparkles className="w-4 h-4" style={{ color: grad2 }} /> Job Jugaad AI Member
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            { icon: <Mail className="w-5 h-5" />, label: "Email", value: email, c: grad1 },
            { icon: <Calendar className="w-5 h-5" />, label: "Member Since", value: createdAt, c: grad2 },
            { icon: <Shield className="w-5 h-5" />, label: "Sign-in Method", value: provider === "google" ? "Google OAuth" : "Email & Password", c: "#22d3ee" },
            { icon: <User className="w-5 h-5" />, label: "User ID", value: user.id.slice(0, 8) + "…", c: "#a78bfa" },
          ].map((item) => (
            <div key={item.label} className="profile-info-card group rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-start gap-4 cursor-default">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform"
                style={{ background: `${item.c}1a`, color: item.c }}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-0.5">{item.label}</p>
                <p className="text-sm font-bold text-white truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="profile-action-card rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/analyze"
              className="profile-action-card flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 group">
              <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Analyze Resume</p>
                <p className="text-xs text-white/30">New scan</p>
              </div>
            </Link>
            <Link href="/dashboard"
              className="profile-action-card flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 group">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Dashboard</p>
                <p className="text-xs text-white/30">History & stats</p>
              </div>
            </Link>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signOutLoading}
          className="profile-action-card w-full py-4 px-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold flex items-center justify-center gap-2 transition-all hover:border-red-500/40 disabled:opacity-60"
        >
          {signOutLoading
            ? <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
            : <LogOut className="w-5 h-5" />}
          {signOutLoading ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </div>
  );
}
