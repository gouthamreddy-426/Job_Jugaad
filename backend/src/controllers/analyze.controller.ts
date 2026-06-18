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

  const prompt = `You are a senior ATS (Applicant Tracking System) expert and career coach with 15+ years of experience. Analyze the resume against the job description below. Return ONLY valid JSON — absolutely no markdown, no code fences, no extra text.

CRITICAL RULES FOR SKILLS:
- "matchedSkills" and "missingSkills.name" must ONLY contain real professional skills: specific technologies (React, Python, Kubernetes), tools (Jira, Figma, Docker), frameworks (Django, Spring Boot), methodologies (Agile, Scrum, TDD), certifications (AWS Certified, PMP), or domain concepts (Machine Learning, REST API, CI/CD).
- NEVER include: common English words, prepositions, articles, generic phrases, sentence fragments, or words like "Response", "Request", "to", "from", "the", "and", "with", "using", "experience", "skills", "ability", "knowledge", "understanding", "strong".
- Each skill name must be a PROPER NOUN or TECHNICAL TERM, typically 1-4 words max (e.g., "TypeScript", "Spring Boot", "AWS Lambda", "System Design").

RESUME:
${resumeText.slice(0, 4000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

Return exactly this JSON structure:
{
  "atsScore": <integer 0-100, honest ATS compatibility score>,
  "keywordMatchRate": <integer 0-100, percentage of JD technical keywords found in resume>,
  "matchedSkills": [
    "<ONLY real tech/tool/framework names that appear in BOTH resume AND job description — max 12>"
  ],
  "missingSkills": [
    {
      "name": "<real technical skill or tool name — NOT a generic phrase>",
      "importance": "<critical|high|medium|low>",
      "category": "<Technical|Soft Skills|Tools|Domain Knowledge|Certifications>",
      "tip": "<one actionable sentence on how to demonstrate this skill>"
    }
  ],
  "resumeStrengths": [
    "<4-5 specific, concrete strengths visible in this resume — reference actual content>"
  ],
  "improvementTips": [
    {
      "section": "<Work Experience|Skills|Summary|Education|Projects|Certifications>",
      "toAdd": [
        "<specific bullet or content to ADD — cite actual missing content from JD>"
      ],
      "toRemove": [
        "<specific vague phrase or content to REMOVE/REWRITE from the resume>"
      ]
    }
  ],
  "skillsToLearn": [
    {
      "name": "<real skill name>",
      "priority": "<critical|high|medium>",
      "timeframe": "<realistic timeframe e.g. 2-3 weeks>",
      "reason": "<one sentence why this skill matters for this specific role>"
    }
  ],
  "overallFeedback": "<2-3 sentence honest assessment of fit for this specific role>",
  "industryBenchmark": <integer, typical ATS score for top candidates in this role>
}

Rules:
- improvementTips must cover at least 3 sections (Work Experience, Skills, Summary minimum)
- Every improvementTip section MUST have at least 1 item in both toAdd AND toRemove
- missingSkills should have 4-10 items, all real technical skills
- matchedSkills should have 4-12 items, all real technical skills found in the resume`;

  try {
    const raw = await callGroq(prompt, { temperature: 0.2, maxTokens: 4096 });

    let result: AnalysisResult;
    try {
      result = JSON.parse(raw) as AnalysisResult;
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned invalid JSON. Please try again.");
      result = JSON.parse(match[0]) as AnalysisResult;
    }

    if (!result.skillsToLearn) result.skillsToLearn = [];
    if (!result.matchedSkills) result.matchedSkills = [];
    if (!result.missingSkills) result.missingSkills = [];
    if (!result.improvementTips) result.improvementTips = [];

    const STOP_WORDS = new Set([
      "to", "from", "the", "and", "with", "using", "in", "of", "for", "a", "an",
      "is", "are", "be", "by", "at", "on", "it", "as", "or", "if", "up",
      "experience", "skills", "ability", "knowledge", "understanding", "strong",
      "good", "great", "excellent", "work", "team", "business", "response", "request",
    ]);
    const isRealSkill = (s: string) =>
      s && s.length > 1 && !STOP_WORDS.has(s.toLowerCase()) && !/^[a-z]{1,2}$/i.test(s);

    result.matchedSkills = result.matchedSkills.filter(isRealSkill);
    result.missingSkills = result.missingSkills.filter((s) => isRealSkill(s.name));

    for (const tip of result.improvementTips) {
      if (!tip.toAdd) tip.toAdd = [];
      if (!tip.toRemove) tip.toRemove = [];
    }

    if (userId) {
      saveAnalysisToDB(userId, req, resumeText, jobDescription, company, role, result).catch((e) =>
        console.error("[DB] Save failed:", e instanceof Error ? e.message : e)
      );
    } else {
      console.log("[Analyze] No userId — skipping DB save (user not logged in)");
    }

    res.json({ data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    console.error("[Analyze] Error:", message);
    res.status(500).json({ error: message });
  }
}

async function saveAnalysisToDB(
  userId: string,
  req: Request,
  resumeText: string,
  jobDescription: string,
  company: string,
  role: string,
  result: AnalysisResult
): Promise<void> {
  const authReq = req as AuthRequest;

  await query(
    `INSERT INTO users (id, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       name = COALESCE(users.name, EXCLUDED.name)`,
    [userId, authReq.userEmail ?? "", authReq.userEmail?.split("@")[0] ?? "User"]
  );

  const [resumeRow] = await query<{ id: string }>(
    `INSERT INTO resumes (user_id, parsed_content)
     VALUES ($1, $2::jsonb)
     RETURNING id`,
    [userId, JSON.stringify({ text: resumeText.slice(0, 8000), wordCount: resumeText.split(/\s+/).length })]
  );

  const [jdRow] = await query<{ id: string }>(
    `INSERT INTO job_descriptions (user_id, company, role, parsed_requirements)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id`,
    [userId, company || "", role || "", JSON.stringify({ text: jobDescription.slice(0, 4000) })]
  );

  await query(
    `INSERT INTO analyses (user_id, resume_id, jd_id, overall_match_score, ai_report)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [userId, resumeRow.id, jdRow.id, result.atsScore, JSON.stringify(result)]
  );

  console.log(`[DB] Analysis saved for user ${userId} — ATS: ${result.atsScore}`);
}
