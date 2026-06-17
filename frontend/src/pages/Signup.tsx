import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail, Lock, Eye, EyeOff, Zap, User,
  FileUp, Sparkles, PieChart, ArrowLeft, AlertCircle, CheckCircle2
} from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const steps = [
  { icon: <FileUp className="w-5 h-5" />, title: "Upload Resume", desc: "PDF or paste text" },
  { icon: <Sparkles className="w-5 h-5" />, title: "AI Analysis", desc: "Smart ATS keyword mapping" },
  { icon: <PieChart className="w-5 h-5" />, title: "Get Your Report", desc: "Skill gaps & fixes" },
];

export default function Signup() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setServerError(null);
    const { error } = await signUp(data.email, data.password, data.name);
    setIsLoading(false);
    if (error) { setServerError(error); return; }
    setSuccess(true);
    setTimeout(() => setLocation("/"), 2000);
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) setServerError(error.message);
  };

  return (
    <div className="min-h-screen flex bg-background font-sans">
      <Link href="/" className="absolute top-4 left-4 z-50 text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>

      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-tr from-accent/10 via-background to-primary/10 items-center justify-center p-12 overflow-hidden border-r border-border dark:bg-card">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, -90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-lg">
          <div className="mb-16 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Job Jugaad AI</h1>
              <p className="text-sm font-medium text-muted-foreground">Bridge the gap, get the job.</p>
            </div>
          </div>
          <div className="relative pl-6">
            <div className="absolute left-[33px] top-8 bottom-8 w-1 bg-border rounded-full" />
            <div className="space-y-12 relative z-10">
              {steps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.2, duration: 0.6 }} className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-card border-2 border-primary/20 shadow-md flex items-center justify-center text-primary shrink-0">{step.icon}</div>
                  <div className="pt-2">
                    <h3 className="text-xl font-bold mb-1">{step.title}</h3>
                    <p className="text-muted-foreground font-medium">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <Link href="/" className="absolute top-8 left-8 lg:hidden flex items-center gap-2 font-extrabold text-lg">
          <Zap className="w-5 h-5 text-primary" /> Job Jugaad AI
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white dark:bg-card p-8 sm:p-10 rounded-3xl shadow-xl border border-border"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold mb-2">Create account</h2>
            <p className="text-muted-foreground font-medium">Join thousands of students getting hired</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {serverError}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Account created! Redirecting...
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="text" {...form.register("name")}
                  className="block w-full pl-11 pr-4 py-3 bg-secondary border border-transparent rounded-xl focus:bg-white dark:focus:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium dark:text-foreground dark:bg-secondary"
                  placeholder="John Doe" />
              </div>
              {form.formState.errors.name && <p className="text-sm text-destructive font-medium">{form.formState.errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="email" {...form.register("email")}
                  className="block w-full pl-11 pr-4 py-3 bg-secondary border border-transparent rounded-xl focus:bg-white dark:focus:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium dark:text-foreground dark:bg-secondary"
                  placeholder="you@example.com" />
              </div>
              {form.formState.errors.email && <p className="text-sm text-destructive font-medium">{form.formState.errors.email.message}</p>}
            </div>

            {/* Password (single field — no confirm) */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} {...form.register("password")}
                  className="block w-full pl-11 pr-12 py-3 bg-secondary border border-transparent rounded-xl focus:bg-white dark:focus:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium dark:text-foreground dark:bg-secondary"
                  placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.formState.errors.password && <p className="text-sm text-destructive font-medium">{form.formState.errors.password.message}</p>}
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 disabled:opacity-70 flex items-center justify-center gap-2 mt-2">
              {isLoading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isLoading ? "Creating account..." : "Create Account"}
            </motion.button>
          </form>

          <div className="my-6 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <span className="relative px-4 bg-white dark:bg-card text-sm font-bold text-muted-foreground">or</span>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="button" onClick={handleGoogle}
            className="w-full py-3.5 bg-white dark:bg-secondary border border-border font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-secondary dark:hover:bg-muted transition-all">
            <SiGoogle className="h-5 w-5" /> Sign up with Google
          </motion.button>

          <p className="text-center text-sm font-medium mt-6 text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
