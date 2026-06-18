import type { Request, Response } from "express";
import { z } from "zod";
import { callGroq } from "../lib/groq.js";
import type { PracticeData } from "../types/index.js";

const PracticeBodySchema = z.object({
  jobDescription: z.string().default(""),
  missingSkills: z.array(z.string()).default([]),
  matchedSkills: z.array(z.string()).default([]),
  jobTitle: z.string().default("Software Engineer"),
  company: z.string().default(""),
  overallFeedback: z.string().default(""),
});

export async function generatePractice(req: Request, res: Response): Promise<void> {
  const parsed = PracticeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { jobDescription, missingSkills, matchedSkills, jobTitle, company, overallFeedback } = parsed.data;

  const missingStr = missingSkills.slice(0, 10).join(", ") || "General software engineering skills";
  const matchedStr = matchedSkills.slice(0, 12).join(", ") || "None specified";
  const companyLabel = company ? `at ${company}` : "";

  const prompt = `You are a SENIOR TECHNICAL INTERVIEWER ${companyLabel ? `at a company like ${company}` : "at a top tech company"}. Your job is to create a RIGOROUS interview practice plan that specifically targets:

1. (60% of questions) JOB DESCRIPTION requirements — what THIS specific job ACTUALLY demands. For skills the candidate CLAIMS to have but the JD heavily requires, generate DEEP VERIFICATION questions because candidates often fake projects. These questions must be expert-level, probing, and impossible to bluff through without real experience.

2. (40% of questions) Skills genuinely MISSING from the candidate's resume — questions to help them learn and fill real gaps.

CRITICAL ANTI-FAKE-PROJECT RULE: If a skill appears in BOTH "Candidate's Claimed Skills" AND the JD requires it heavily, mark it source="jd-verification" and set probeDepth="expert" or "deep". The verification questions must probe REAL hands-on experience — ask about specific failure modes, edge cases, performance tradeoffs, debugging war stories, and implementation decisions that only someone who actually used the skill would know.

JOB TITLE: ${jobTitle}
${company ? `COMPANY: ${company}` : ""}
JOB DESCRIPTION: ${jobDescription.slice(0, 2000)}

CANDIDATE'S CLAIMED SKILLS (from resume — verify these if JD requires them heavily):
${matchedStr}

SKILLS MISSING FROM RESUME (genuine gaps — help them learn):
${missingStr}

COACH ASSESSMENT: ${overallFeedback.slice(0, 400)}

Return ONLY valid raw JSON (no markdown fences):
{
  "questions": [
    {
      "type": "dsa|system-design|behavioral|technical",
      "title": "<specific, direct question title>",
      "difficulty": "Easy|Medium|Hard",
      "category": "<specific skill or concept being tested>",
      "description": "<2-3 sentences — for jd-verification questions: probe real hands-on experience, ask about edge cases, failures, decisions, tradeoffs. For resume-gap questions: help them understand what to learn and why>",
      "hint": "<practical hint — for verification: a clue about what depth of answer is expected. For gaps: a learning direction>",
      "followUps": ["<probing follow-up 1>", "<probing follow-up 2>"],
      "skillTarget": "<exact skill name being tested>",
      "source": "jd-verification|jd-requirement|resume-gap",
      "probeDepth": "surface|deep|expert"
    }
  ],
  "youtubeResources": [
    {
      "query": "<specific YouTube search query>",
      "topic": "<skill topic>",
      "channel": "<recommended channel>",
      "description": "<one sentence — why this video helps for THIS specific job>"
    }
  ],
  "studyPlan": "<3-4 sentence personalized study plan — mention specific skills, timeframes, and the 60/40 JD-vs-gap approach>",
  "jdWeight": 60,
  "gapWeight": 40,
  "verificationCount": <integer — count of jd-verification questions>,
  "disclaimer": "Questions marked 'JD Critical — Verify' test skills you listed on your resume that this job highly values. Be prepared to discuss real implementation details, failure modes, and tradeoffs — not just surface-level knowledge."
}

QUESTION GENERATION RULES:
- Total: 11-13 questions
- ~7 questions from JD (source: "jd-verification" or "jd-requirement") — these are the 60%
  * "jd-verification": skill is in candidate's resume AND heavily required in JD — mark probeDepth="expert" or "deep", Hard/Medium difficulty, ask about real experiences
  * "jd-requirement": skill is in JD but NOT in candidate's resume — mark probeDepth="surface" or "deep"
- ~5 questions from resume gaps (source: "resume-gap") — these are the 40%, can be Medium/Easy, learning-focused
- Always include: 1 DSA (targeted to JD requirements), 2 system-design (role-specific), 2 behavioral (with situational probing), rest are technical
- YouTube resources: 5-6, skewed toward JD-required skills and verification topics

VERIFICATION QUESTION STYLE (for jd-verification):
- Don't ask "what is X" — ask "Tell me about a time your X implementation caused a production issue and how you debugged it"
- "What tradeoffs did you make when choosing X over Y in your project?"
- "Walk me through the worst bug you've hit with X and how you resolved it"
- "If your X setup was handling 10x traffic, what would break first?"
These are designed to expose fake projects. Someone who only did a tutorial won't be able to answer these.`;

  try {
    const raw = await callGroq(prompt, { temperature: 0.35, maxTokens: 4096 });

    let result: PracticeData;
    try {
      result = JSON.parse(raw) as PracticeData;
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned invalid JSON. Please try again.");
      result = JSON.parse(match[0]) as PracticeData;
    }

    if (!result.questions) result.questions = [];
    if (!result.youtubeResources) result.youtubeResources = [];
    if (!result.studyPlan) result.studyPlan = "";
    if (!result.jdWeight) result.jdWeight = 60;
    if (!result.gapWeight) result.gapWeight = 40;
    if (!result.disclaimer) result.disclaimer = "Questions test both your claimed skills and genuine gaps.";

    result.verificationCount = result.questions.filter(q => q.source === "jd-verification").length;

    for (const q of result.questions) {
      if (!q.followUps) q.followUps = [];
      if (!q.skillTarget) q.skillTarget = q.category ?? "";
      if (!q.source) q.source = "jd-requirement";
      if (!q.probeDepth) q.probeDepth = "deep";
    }

    res.json({ data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[Practice] Error:", message);
    res.status(500).json({ error: message });
  }
}
