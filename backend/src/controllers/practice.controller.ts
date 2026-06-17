import type { Request, Response } from "express";
import { z } from "zod";
import { callGroq } from "../lib/groq.js";
import type { PracticeData } from "../types/index.js";

const PracticeBodySchema = z.object({
  jobDescription: z.string().default(""),
  missingSkills: z.array(z.string()).default([]),
  jobTitle: z.string().default("Software Engineer"),
  overallFeedback: z.string().default(""),
});

export async function generatePractice(req: Request, res: Response): Promise<void> {
  const parsed = PracticeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { jobDescription, missingSkills, jobTitle, overallFeedback } = parsed.data;
  const skillsStr = missingSkills.slice(0, 10).join(", ");

  const prompt = `You are a senior technical interviewer. Generate a personalized interview practice plan tailored exactly to the candidate's skill gaps and job requirements. Return ONLY raw JSON, no markdown.

JOB DESCRIPTION: ${jobDescription.slice(0, 1500)}
MISSING SKILLS: ${skillsStr || "General software engineering skills"}
JOB TITLE: ${jobTitle}
COACH ASSESSMENT: ${overallFeedback.slice(0, 500)}

Return this exact JSON:
{
  "questions": [
    {
      "type": "dsa|system-design|behavioral|technical",
      "title": "<specific title relevant to the job/skills>",
      "difficulty": "Easy|Medium|Hard",
      "category": "<specific category>",
      "description": "<2-3 sentence description tailored to the missing skills>",
      "hint": "<1 sentence practical hint>",
      "followUps": ["<follow-up question 1>", "<follow-up question 2>"]
    }
  ],
  "youtubeResources": [
    {
      "query": "<specific YouTube search query for this skill gap>",
      "topic": "<topic>",
      "channel": "<recommended channel name>",
      "description": "<one sentence about what to learn>"
    }
  ],
  "studyPlan": "<2-3 sentence personalized study plan based on the specific gaps>"
}

Generate: 3 DSA questions (1 Easy, 1 Medium, 1 Hard) targeted at missing technical skills, 2 system-design questions relevant to the role, 2 behavioral questions, 3 technical concept questions for the missing skills, and 5 YouTube resources for the specific skill gaps.`;

  try {
    const raw = await callGroq(prompt, { temperature: 0.4, maxTokens: 4096 });
    const result = JSON.parse(raw) as PracticeData;
    res.json({ data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Generation failed";
    res.status(500).json({ error: message });
  }
}
