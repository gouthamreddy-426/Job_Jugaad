import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  User, Mail, Calendar, LogOut, ArrowLeft,
  Camera, CheckCircle2, Zap, BarChart2, FileText,
  Edit3, Save, X, Shield, Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const AVATAR_COLORS = [
  ["from-violet-500 to-pink-500", "VP"],
  ["from-blue-500 to-cyan-500", "BC"],
  ["from-emerald-500 to-teal-500", "ET"],
  ["from-orange-500 to-red-500", "OR"],
  ["from-indigo-500 to-purple-500", "IP"],
];

function getAvatarGradient(email: string) {
  const idx = email.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx][0];
}

function getInitials(name: string, email: string) {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const particleCount = 20;
const particles = Array.from({ length: particleCount }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 2,
}));

export default function Profile() {
  const { user, signOut, getToken } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.name ?? user?.user_metadata?.full_name ?? ""
  );
  const [editName, setEditName] = useState(displayName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4 font-medium">You need to be signed in to view your profile.</p>
          <Link href="/login" className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const email = user.email ?? "";
  const avatarGradient = getAvatarGradient(email);
  const initials = getInitials(displayName, email);
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Unknown";
  const provider = user.app_metadata?.provider ?? "email";

  const handleSaveName = async () => {
    if (!editName.trim() || editName === displayName) {
      setIsEditingName(false);
      return;
    }
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
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px]"
        />
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-primary/20"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ y: [0, -30, 0], opacity: [0, 0.6, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/60 dark:bg-background/80 border-b border-border"
      >
        <Link href="/" className="flex items-center gap-2 font-bold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-extrabold text-sm">Job Jugaad AI</span>
        </div>
      </motion.nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative bg-white dark:bg-card rounded-3xl shadow-2xl shadow-primary/10 border border-border overflow-hidden mb-6"
        >
          {/* Gradient header */}
          <div className={`h-28 bg-gradient-to-br ${avatarGradient} relative overflow-hidden`}>
            <motion.div
              animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-white/10 rounded-full"
            />
            <motion.div
              animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-[-40px] left-[20%] w-32 h-32 bg-white/10 rounded-full"
            />
          </div>

          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="relative -mt-12 mb-5 w-fit">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-2xl font-extrabold shadow-xl border-4 border-white dark:border-card select-none`}
              >
                {initials}
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-card"
              />
            </div>

            {/* Name */}
            <div className="flex items-center gap-3 mb-1">
              <AnimatePresence mode="wait">
                {isEditingName ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      ref={inputRef}
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setIsEditingName(false); }}
                      className="text-2xl font-extrabold bg-secondary dark:bg-secondary border border-primary rounded-xl px-3 py-1 outline-none focus:ring-2 focus:ring-primary/30 text-foreground w-52"
                    />
                    <button onClick={handleSaveName} disabled={nameLoading} className="p-1.5 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity">
                      {nameLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setIsEditingName(false)} className="p-1.5 rounded-lg bg-secondary hover:bg-muted transition-colors text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-foreground">
                      {displayName || "No name set"}
                    </h1>
                    <button
                      onClick={() => { setEditName(displayName); setIsEditingName(true); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {nameSaved && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-1.5 text-green-600 text-sm font-medium mb-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Name updated!
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-muted-foreground font-medium text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent" /> Job Jugaad AI Member
            </p>
          </div>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            { icon: <Mail className="w-5 h-5 text-primary" />, label: "Email", value: email, bg: "bg-primary/5" },
            { icon: <Calendar className="w-5 h-5 text-accent" />, label: "Member Since", value: createdAt, bg: "bg-accent/5" },
            { icon: <Shield className="w-5 h-5 text-emerald-500" />, label: "Sign-in Method", value: provider === "google" ? "Google OAuth" : "Email & Password", bg: "bg-emerald-500/5" },
            { icon: <User className="w-5 h-5 text-indigo-500" />, label: "User ID", value: user.id.slice(0, 8) + "…", bg: "bg-indigo-500/5" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="bg-white dark:bg-card rounded-2xl border border-border p-5 flex items-start gap-4"
            >
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{item.label}</p>
                <p className="text-sm font-bold text-foreground truncate">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/analyze" className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/10 group">
              <div className="w-9 h-9 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <FileText className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Analyze Resume</p>
                <p className="text-xs text-muted-foreground">New analysis</p>
              </div>
            </Link>
            <Link href="/practice" className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors border border-accent/10 group">
              <div className="w-9 h-9 rounded-lg bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center transition-colors">
                <BarChart2 className="w-4.5 h-4.5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Practice Arena</p>
                <p className="text-xs text-muted-foreground">Mock interviews</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="w-full py-3.5 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-60"
          >
            {signOutLoading
              ? <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
              : <LogOut className="w-5 h-5" />}
            {signOutLoading ? "Signing out..." : "Sign Out"}
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}
