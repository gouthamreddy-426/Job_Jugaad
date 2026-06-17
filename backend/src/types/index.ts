export interface SkillGap {
  name: string;
  importance: "critical" | "high" | "medium" | "low";
  category: string;
  tip: string;
}

export interface SectionImprovement {
  section: string;
  toAdd: string[];
  toRemove: string[];
}

export interface SkillToLearn {
  name: string;
  priority: "critical" | "high" | "medium";
  timeframe: string;
  reason: string;
}

export interface AnalysisResult {
  atsScore: number;
  keywordMatchRate: number;
  matchedSkills: string[];
  missingSkills: SkillGap[];
  resumeStrengths: string[];
  improvementTips: SectionImprovement[];
  skillsToLearn: SkillToLearn[];
  overallFeedback: string;
  industryBenchmark: number;
}

export interface PracticeQuestion {
  type: "dsa" | "system-design" | "behavioral" | "technical";
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  description: string;
  hint: string;
  followUps: string[];
}

export interface PracticeData {
  questions: PracticeQuestion[];
  youtubeResources: {
    query: string;
    topic: string;
    channel: string;
    description: string;
  }[];
  studyPlan: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}
