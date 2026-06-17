import type { AnalysisResult, SkillGap } from "@/types/analysis";

const STOP_WORDS = new Set([
  "the", "and", "a", "to", "of", "in", "i", "is", "that", "it", "on", "you",
  "this", "for", "but", "with", "are", "have", "be", "at", "or", "as", "was",
  "so", "if", "out", "not", "we", "my", "your", "an", "can", "they", "will",
  "do", "all", "would", "about", "there", "their", "what", "which", "when",
  "how", "who", "where", "why", "some", "any", "could", "should", "from",
  "these", "those", "has", "had", "been", "our", "us", "me", "he", "she",
  "him", "her", "his", "hers", "by", "up", "down", "more", "less", "many",
  "much", "only", "also", "then", "than", "other", "another", "such", "like",
  "just", "over", "under", "into", "through", "after", "before", "between",
]);

function getWords(text: string): Set<string> {
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  return new Set(words.filter(w => !STOP_WORDS.has(w)));
}

export function mockAnalyze(resume: string, jd: string): AnalysisResult {
  const resumeWords = getWords(resume);
  const jdWords = Array.from(getWords(jd));
  const matchedSkills: string[] = [];
  const potentialMissing: string[] = [];

  for (const word of jdWords) {
    if (resumeWords.has(word)) matchedSkills.push(word);
    else potentialMissing.push(word);
  }

  const shuffledMissing = potentialMissing.sort(() => 0.5 - Math.random()).slice(0, 5);
  const importanceLevels: SkillGap["importance"][] = ["critical", "high", "medium", "low"];
  const categories = ["Core Competency", "Technical", "Soft Skill", "Domain Knowledge"];

  const missingSkills: SkillGap[] = shuffledMissing.map(skill => ({
    name: skill.charAt(0).toUpperCase() + skill.slice(1),
    importance: importanceLevels[Math.floor(Math.random() * importanceLevels.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    tip: `Consider taking a short course or building a project utilizing ${skill} to close this gap.`,
  }));

  const matchRatio = jdWords.length > 0 ? matchedSkills.length / jdWords.length : 0;
  let baseScore = Math.floor(matchRatio * 100);
  if (baseScore < 20) baseScore = 20 + Math.floor(Math.random() * 20);
  if (baseScore > 95) baseScore = 95;

  return {
    atsScore: baseScore,
    keywordMatchRate: baseScore,
    matchedSkills: matchedSkills.slice(0, 15),
    missingSkills,
    resumeStrengths: [
      "Clear formatting and good length.",
      "Strong action verbs used in experience section.",
      "Education section is prominent and clear.",
      "No major spelling or grammar issues detected.",
    ],
    improvementTips: [
      { section: "Work Experience", tips: ["Quantify achievements with metrics.", "Focus on impact over responsibilities."] },
      { section: "Skills", tips: ["Group skills by category.", "Ensure JD keywords appear prominently."] },
      { section: "Summary", tips: ["Tailor your summary to the role.", "Keep it under 3-4 sentences."] },
    ],
    overallFeedback: "Your resume has a solid foundation but lacks specific keywords from the job description.",
    industryBenchmark: 68,
  };
}
