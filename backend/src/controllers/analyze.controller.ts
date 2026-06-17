import type { Request, Response } from "express";
import { z } from "zod";
import { callGroq } from "../lib/groq.js";
import { query } from "../lib/db.js";
import type { AnalysisResult } from "../types/index.js";
import type { AuthRequest } from "../middleware/auth.js";

const AnalyzeBodySchema = z.object({
  resumeText: z.string().min(50, "Resume text is too short"),
  jobDescription: z.string().min(50, "Job description is too short"),
  company: z.string().optional().default(""),
  role: z.string().optional().default(""),
});

export async function analyze(req: Request, res: Response): Promise<void> {
  const parsed = AnalyzeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid request" });
    return;
  }

  const { resumeText, jobDescription, company, role } = parsed.data;
  const userId = (req as AuthRequest).userId ?? null;

  const prompt = `You are a senior career coach and ATS expert. Analyze this resume against the job description. Return ONLY valid JSON — no markdown fences, no comments, no explanation.

CRITICAL RULE: For every resume section in "improvementTips", you MUST provide BOTH:
1. "toAdd" — specific bullet points or content to ADD to that section
2. "toRemove" — specific phrases, skills, or content to REMOVE or rewrite in that section
Both arrays MUST have at least 1–3 items. Never leave either array empty.

RESUME:
${resumeText.slice(0, 4000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

Return this exact JSON structure:
{
  "atsScore": <integer 0-100>,
  "keywordMatchRate": <integer 0-100>,
  "matchedSkills": [<string array, max 12 matched keywords>],
  "missingSkills": [
    {
      "name": "<skill name>",
      "importance": "<critical|high|medium|low>",
      "category": "<Technical|Soft Skills|Tools|Domain Knowledge|Certifications>",
      "tip": "<one sentence on where/how to demonstrate this skill>"
    }
  ],
  "resumeStrengths": [<4-5 specific strengths present in this resume>],
  "improvementTips": [
    {
      "section": "<Work Experience|Skills|Summary|Education|Projects|Certifications>",
      "toAdd": [
        "<Specific content to ADD — e.g. 'Add a metric like Reduced load time by 40%'>"
      ],
      "toRemove": [
        "<Specific content to REMOVE or REWRITE — e.g. 'Remove vague phrase responsible for team tasks'>"
      ]
    }
  ],
  "skillsToLearn": [
    {
      "name": "<skill name>",
      "priority": "<critical|high|medium>",
      "timeframe": "<e.g. 2-3 weeks, 1 month>",
      "reason": "<one sentence why this skill matters for the role>"
    }
  ],
  "overallFeedback": "<2-3 sentence candid assessment of fit for this specific role>",
  "industryBenchmark": <integer, typical ATS score for strong candidates in this role>
}

Generate "improvementTips" for at least 3 different sections (Work Experience, Skills, Summary minimum). Each section MUST have both toAdd and toRemove with real, specific suggestions — not generic advice.`;

  try {
    const raw = await callGroq(prompt, { temperature: 0.25, maxTokens: 4096 });
    const result = JSON.parse(raw) as AnalysisResult;

    if (!result.skillsToLearn) result.skillsToLearn = [];
    for (const tip of result.improvementTips ?? []) {
      if (!tip.toAdd) tip.toAdd = [];
      if (!tip.toRemove) tip.toRemove = [];
    }

    if (userId) {
      try {
        await ensureUserExists(userId, req);

        const [resumeRow] = await query<{ id: string }>(
          `INSERT INTO resumes (user_id, parsed_content)
           VALUES ($1, $2::jsonb)
           RETURNING id`,
          [userId, JSON.stringify({ text: resumeText.slice(0, 8000) })]
        );

        const [jdRow] = await query<{ id: string }>(
          `INSERT INTO job_descriptions (user_id, company, role, parsed_requirements)
           VALUES ($1, $2, $3, $4::jsonb)
           RETURNING id`,
          [
            userId,
            company || "",
            role || "",
            JSON.stringify({ text: jobDescription.slice(0, 4000) }),
          ]
        );

        await query(
          `INSERT INTO analyses (user_id, resume_id, jd_id, overall_match_score, ai_report)
           VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [
            userId,
            resumeRow.id,
            jdRow.id,
            result.atsScore,
            JSON.stringify(result),
          ]
        );
      } catch (dbErr: unknown) {
        console.error("[DB] Failed to save analysis:", dbErr instanceof Error ? dbErr.message : dbErr);
      }
    }

    res.json({ data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    res.status(500).json({ error: message });
  }
}

async function ensureUserExists(userId: string, req: Request): Promise<void> {
  const authReq = req as AuthRequest;
  const existing = await query("SELECT id FROM users WHERE id = $1", [userId]);
  if (existing.length === 0) {
    await query(
      `INSERT INTO users (id, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [userId, authReq.userEmail ?? "", authReq.userEmail?.split("@")[0] ?? "User"]
    );
  }
}
