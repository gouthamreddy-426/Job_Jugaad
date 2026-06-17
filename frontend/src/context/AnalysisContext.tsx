import React, { createContext, useContext, useState } from "react";
import type { AnalysisResult } from "@/types/analysis";

export type { SkillGap, SectionImprovement, SkillToLearn, AnalysisResult } from "@/types/analysis";

interface AnalysisContextType {
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
  jobDescription: string;
  setJobDescription: (v: string) => void;
  resumeText: string;
  setResumeText: (v: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AnalysisContext.Provider value={{
      result, setResult,
      jobDescription, setJobDescription,
      resumeText, setResumeText,
      isAnalyzing, setIsAnalyzing,
      error, setError,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) throw new Error("useAnalysis must be used within an AnalysisProvider");
  return context;
}
