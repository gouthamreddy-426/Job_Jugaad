import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);

      const errorParam = params.get("error");
      const errorDescription = params.get("error_description");

      if (errorParam) {
        setErrorMsg(errorDescription ?? errorParam);
        setStatus("error");
        return;
      }

      if (hash) {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setErrorMsg(error.message);
          setStatus("error");
          return;
        }
        if (data.session) {
          setLocation("/");
          return;
        }
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(
        params.get("code") ?? ""
      );

      if (error || !data.session) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          setLocation("/");
          return;
        }
        setErrorMsg(error?.message ?? "Authentication failed. Please try again.");
        setStatus("error");
        return;
      }

      setLocation("/");
    };

    handleCallback();
  }, [setLocation]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm p-8 bg-white dark:bg-card rounded-3xl shadow-xl border border-border"
        >
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">Sign In Failed</h2>
          <p className="text-muted-foreground text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => setLocation("/login")}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Back to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg mx-auto mb-4"
        >
          <Zap className="w-7 h-7 text-white" />
        </motion.div>
        <p className="text-foreground font-bold text-lg">Signing you in...</p>
        <p className="text-muted-foreground text-sm mt-1">Just a moment</p>
      </motion.div>
    </div>
  );
}
