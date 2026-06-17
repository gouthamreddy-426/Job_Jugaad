import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, Zap, FileText, ArrowLeft, AlertCircle } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError(null);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);
    if (error) {
      setServerError(error);
      return;
    }
    setLocation("/");
  };

  const handleGoogleSignIn = async () => {
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
    <div className="min-h-screen flex bg-background dark:bg-background font-sans">
      <Link href="/" className="absolute top-4 left-4 z-50 text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>

      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-primary/10 via-background to-accent/10 items-center justify-center p-12 overflow-hidden border-r border-border dark:bg-card dark:border-border">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] pointer-events-none"
        />
        <div className="relative z-10 w-full max-w-lg">
          <div className="mb-12 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight dark:text-foreground">Job Jugaad AI</h1>
              <p className="text-sm font-medium text-muted-foreground">Bridge the gap, get the job.</p>
            </div>
          </div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-white dark:bg-card rounded-3xl p-8 shadow-2xl shadow-primary/10 border border-primary/10 dark:border-border"
          >
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-foreground">Resume Scanner</h3>
                <p className="text-muted-foreground text-sm font-medium">Analyzing 1,204 data points...</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: "Frontend Architecture", score: 92, color: "bg-green-500" },
                { label: "System Design", score: 85, color: "bg-primary" },
                { label: "Cloud Deployment", score: 45, color: "bg-accent" },
              ].map((skill, i) => (
                <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 + i * 0.15 }} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold dark:text-foreground">
                    <span>{skill.label}</span><span>{skill.score}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${skill.score}%` }} transition={{ duration: 1, delay: 0.8 + i * 0.1 }} className={`h-full ${skill.color} rounded-full`} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <Link href="/" className="absolute top-8 left-8 lg:hidden flex items-center gap-2 font-extrabold text-lg dark:text-foreground">
          <Zap className="w-5 h-5 text-primary" /> Job Jugaad AI
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white dark:bg-card p-8 sm:p-10 rounded-3xl shadow-xl shadow-border/50 border border-border dark:border-border dark:shadow-none"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold mb-2 text-foreground dark:text-foreground">Welcome back</h2>
            <p className="text-muted-foreground font-medium">Sign in to your account to continue</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground dark:text-foreground">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  {...form.register("email")}
                  className="block w-full pl-11 pr-4 py-3 bg-secondary dark:bg-secondary border border-transparent dark:border-border rounded-xl focus:bg-white dark:focus:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium dark:text-foreground dark:placeholder:text-muted-foreground"
                  placeholder="you@example.com"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive font-medium">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-foreground dark:text-foreground">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                  className="block w-full pl-11 pr-12 py-3 bg-secondary dark:bg-secondary border border-transparent dark:border-border rounded-xl focus:bg-white dark:focus:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium dark:text-foreground dark:placeholder:text-muted-foreground"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive font-medium">{form.formState.errors.password.message}</p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all mt-2 dark:text-white disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {isLoading ? "Signing in..." : "Sign In"}
            </motion.button>
          </form>

          <div className="my-8 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative px-4 bg-white dark:bg-card text-sm font-bold text-muted-foreground">or continue with</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-4 bg-white dark:bg-secondary text-foreground dark:text-foreground border border-border dark:border-border font-bold rounded-xl shadow-sm flex items-center justify-center gap-3 hover:bg-secondary dark:hover:bg-muted transition-all"
          >
            <SiGoogle className="h-5 w-5" /> Google
          </motion.button>

          <p className="text-center text-sm font-medium mt-8 text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary dark:text-primary font-bold hover:underline">Sign up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
