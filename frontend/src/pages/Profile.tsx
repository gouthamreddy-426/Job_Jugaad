import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  User, Mail, Calendar, LogOut, ArrowLeft,
  CheckCircle2, Zap, BarChart2, FileText,
  Edit3, Save, X, Shield, Sparkles, Trophy,
  Sun, Moon, ScanLine
} from "lucide-react";
import { supabase } from "@/lib/supabase";

function getAvatarColors(email: string) {
  const palettes = [
    { from: "#7c3aed", to: "#ec4899" },
    { from: "#2563eb", to: "#06b6d4" },
    { from: "#059669", to: "#0d9488" },
    { from: "#d97706", to: "#dc2626" },
    { from: "#4f46e5", to: "#7c3aed" },
  ];
  return palettes[email.charCodeAt(0) % palettes.length];
}

function getInitials(name: string, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function Profile() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [, setLocation] = useLocation();
  const avatarRef = useRef<HTMLDivElement>(null);

  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.name ?? user?.user_metadata?.full_name ?? ""
  );
  const [editName, setEditName] = useState(displayName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  // Avatar hover tilt
  useEffect(() => {
    const el = avatarRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = ((e.clientY - cy) / rect.height) * 16;
      const ry = ((e.clientX - cx) / rect.width) * -16;
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(1.04)`;
    };
    const leave = () => { el.style.transform = ""; };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4 font-medium">Sign in to view your profile.</p>
          <Link href="/login" className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const email = user.email ?? "";
  const colors = getAvatarColors(email);
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
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, ${colors.from}20, transparent)` }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full blur-[100px]"
          style={{ background: `radial-gradient(circle, ${colors.to}18, transparent)` }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 sticky top-0 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-sm hidden sm:block">Job Jugaad AI</span>
          </div>
          <button onClick={toggle}
            className="p-2 rounded-xl border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">

        {/* Hero card */}
        <motion.div {...fadeUp(0)} className="rounded-3xl border border-border bg-white dark:bg-card overflow-hidden mb-5 shadow-sm">

          {/* Cover */}
          <div className="h-28 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${colors.from}55, ${colors.to}44)` }}>
            <div className="absolute inset-0"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />
            <div className="absolute top-3 right-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-sm border border-white/20">
                <Trophy className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-bold text-white">Pro Member</span>
              </div>
            </div>
          </div>

          <div className="px-7 pb-7">
            {/* Avatar */}
            <div className="relative -mt-12 mb-5 w-fit" style={{ perspective: "600px" }}>
              <div ref={avatarRef}
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl border-4 border-background select-none"
                style={{
                  background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                  transition: "transform 0.2s ease",
                }}
              >
                {initials}
              </div>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-background z-20"
              />
            </div>

            {/* Name */}
            <AnimatePresence mode="wait">
              {isEditingName ? (
                <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 mb-1">
                  <input
                    autoFocus value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setIsEditingName(false); }}
                    className="text-2xl font-black bg-secondary border border-border rounded-xl px-3 py-1 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 text-foreground w-52 transition-all"
                  />
                  <button onClick={handleSaveName} disabled={nameLoading}
                    className="p-2 rounded-xl text-white transition-opacity hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}>
                    {nameLoading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Save className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setIsEditingName(false)}
                    className="p-2 rounded-xl bg-secondary hover:bg-border transition-colors text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="viewing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black text-foreground">{displayName || "No name set"}</h1>
                  <button onClick={() => { setEditName(displayName); setIsEditingName(true); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {nameSaved && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-1">
                  <CheckCircle2 className="w-4 h-4" /> Name saved!
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-muted-foreground text-sm flex items-center gap-1.5 font-medium">
              <Sparkles className="w-4 h-4" style={{ color: colors.to }} /> Job Jugaad AI Member
            </p>
          </div>
        </motion.div>

        {/* Info grid */}
        <motion.div {...fadeUp(0.08)} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {[
            { icon: <Mail className="w-5 h-5" />, label: "Email", value: email, color: colors.from },
            { icon: <Calendar className="w-5 h-5" />, label: "Member Since", value: createdAt, color: colors.to },
            { icon: <Shield className="w-5 h-5" />, label: "Sign-in Method", value: provider === "google" ? "Google OAuth" : "Email & Password", color: "#22d3ee" },
            { icon: <User className="w-5 h-5" />, label: "User ID", value: user.id.slice(0, 8) + "…", color: "#a78bfa" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-border bg-white dark:bg-card p-5 flex items-start gap-4 cursor-default shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform"
                style={{ background: `${item.color}18`, color: item.color }}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">{item.label}</p>
                <p className="text-sm font-bold text-foreground truncate">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div {...fadeUp(0.22)} className="rounded-2xl border border-border bg-white dark:bg-card p-6 mb-4 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/analyze", icon: <FileText className="w-5 h-5" />, label: "Analyze Resume", sub: "New scan", bg: "bg-primary/10", text: "text-primary" },
              { href: "/dashboard", icon: <BarChart2 className="w-5 h-5" />, label: "Dashboard", sub: "History & stats", bg: "bg-accent/10", text: "text-accent" },
              { href: "/practice", icon: <ScanLine className="w-5 h-5" />, label: "Practice", sub: "Interview prep", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
              { href: "/", icon: <Sparkles className="w-5 h-5" />, label: "Home", sub: "Back to landing", bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <motion.div whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 bg-secondary/50 hover:bg-secondary transition-all cursor-pointer group">
                  <div className={`w-9 h-9 rounded-lg ${action.bg} ${action.text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.sub}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.button {...fadeUp(0.3)}
          onClick={handleSignOut}
          disabled={signOutLoading}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 px-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-sm hover:shadow-md"
        >
          {signOutLoading
            ? <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
            : <LogOut className="w-5 h-5" />}
          {signOutLoading ? "Signing out…" : "Sign Out"}
        </motion.button>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Job Jugaad AI • AI-powered resume intelligence
        </p>
      </div>
    </div>
  );
}
