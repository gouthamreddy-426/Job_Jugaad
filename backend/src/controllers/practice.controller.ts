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
  const companyCtx = company ? `at a company like ${company}` : "at a top tech company";

  const prompt = `You are a SENIOR TECHNICAL INTERVIEW COACH ${companyCtx}. Create a friendly, encouraging practice plan that helps the candidate prepare confidently for this specific role.

The plan has two focus areas:
1. (60% of questions) What the JD ACTUALLY needs — specifically the skills this job demands most. If a skill is in both the candidate's resume and the JD, the interviewer will go deep on it, so include thorough practice questions so the candidate is fully prepared and confident.
2. (40% of questions) Skills the candidate is genuinely missing — learning-focused questions to help them grow.

JOB TITLE: ${jobTitle}
${company ? `COMPANY: ${company}` : ""}
JOB DESCRIPTION: ${jobDescription.slice(0, 2000)}

CANDIDATE'S CURRENT SKILLS (from resume):
${matchedStr}

SKILLS NOT YET ON RESUME:
${missingStr}

COACH NOTES: ${overallFeedback.slice(0, 400)}

Return ONLY valid raw JSON (no markdown fences):
{
  "questions": [
    {
      "type": "dsa|system-design|behavioral|technical",
      "title": "<specific, direct question>",
      "difficulty": "Easy|Medium|Hard",
      "category": "<skill or concept being practiced>",
      "description": "<2-3 sentences — for JD-priority questions: cover what the JD expects and how to demonstrate real-world experience with this skill; for gap questions: explain what to learn and why it matters for this role>",
      "hint": "<practical, encouraging hint on how to approach this>",
      "followUps": ["<natural follow-up 1>", "<natural follow-up 2>"],
      "skillTarget": "<exact skill name>",
      "source": "jd-verification|jd-requirement|resume-gap",
      "probeDepth": "surface|deep|expert"
    }
  ],
  "youtubeResources": [
    {
      "query": "<specific YouTube search query>",
      "topic": "<skill topic>",
      "channel": "<recommended channel>",
      "description": "<one sentence — why this resource helps for THIS specific job>"
    }
  ],
  "studyPlan": "<3-4 sentence personalized, encouraging study plan — mention specific skills, realistic timeframes, and the JD-first approach>",
  "jdWeight": 60,
  "gapWeight": 40,
  "verificationCount": <integer — count of jd-verification questions>,
  "disclaimer": "Questions marked 'JD Expects This' highlight skills the JD considers critical — give them extra prep time. The more you practice these, the more confident you'll feel in the interview."
}

QUESTION GENERATION RULES:
- Total: 11-13 questions
- ~7 questions from JD focus (source: "jd-verification" or "jd-requirement") — the 60%
  * "jd-verification": skill is on resume AND heavily required in JD — probeDepth="expert" or "deep", go in-depth, ask about real-world application and tradeoffs
  * "jd-requirement": skill needed by JD but not on resume — probeDepth="surface" or "deep", learning-focused
- ~5 questions from skill gaps (source: "resume-gap") — the 40%, can be Medium/Easy, encourage growth
- Mix: 1 DSA, 2 system-design, 2 behavioral, rest technical
- YouTube resources: 5-6, focused on JD-required and priority skills
- Tone: supportive, practical, confidence-building — not intimidating`;

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
    if (!result.disclaimer) result.disclaimer = "Questions marked 'JD Expects This' are the ones the interviewer will likely focus on most — give them extra prep time.";

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
