import type { Request, Response } from "express";
import { z } from "zod";
import { callGroq } from "../lib/groq.js";
import { supabaseAdmin } from "../lib/supabase.js";
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

  const resumeWords = resumeText.trim().split(/\s+/).slice(0, 60).join(" ");
  const jdWords = jobDescription.trim().split(/\s+/).slice(0, 40).join(" ");
  const uniqueSeed = `[Analysis ID: ${Date.now()}-${Math.random().toString(36).slice(2, 8)}]`;

  const prompt = `${uniqueSeed}
You are a strict ATS auditor. You must score THIS SPECIFIC resume against THIS SPECIFIC job description with fresh eyes — do not reuse any previous scores, do not round to round numbers, do not default to generic values.

RESUME FINGERPRINT (first 60 words): "${resumeWords}..."
JD FINGERPRINT (first 40 words): "${jdWords}..."

These fingerprints are for orientation only — analyze the FULL texts below.

FULL RESUME:
${resumeText.slice(0, 4500)}

FULL JOB DESCRIPTION:
${jobDescription.slice(0, 2500)}

SCORING RULES — read carefully:
- atsScore: Count exact keyword overlaps between the resume and JD. Be brutally honest. A resume missing 60% of required keywords cannot score above 50. Do NOT default to 70-75. Every score must be justified by actual content.
- keywordMatchRate: Literally count technical keywords in the JD, then count how many appear verbatim in the resume. Divide and multiply by 100.
- The score WILL differ significantly if the resume changes or the JD changes. If the result is the same as a prior run, re-examine — it is likely wrong.

CRITICAL RULES FOR SKILLS:
- matchedSkills: ONLY skills that appear word-for-word in BOTH texts (e.g. "React", "Python", "Kubernetes"). No paraphrases.
- missingSkills.name: ONLY real technical skills, tools, frameworks, methodologies, certifications, or domain concepts from the JD that are ABSENT from the resume.
- NEVER include: common English words, prepositions, articles, generic phrases like "experience", "skills", "ability", "knowledge", "strong", "good", "great", "work", "team", "business".
- Each skill name must be a proper noun or technical term, 1–4 words max.

Return ONLY valid JSON — no markdown, no code fences, no extra text:
{
  "atsScore": <integer 0-100, computed honestly from keyword overlap — NOT a guess>,
  "keywordMatchRate": <integer 0-100, literal keyword count ratio>,
  "matchedSkills": ["<skill appearing in BOTH resume AND JD — max 12>"],
  "missingSkills": [
    {
      "name": "<specific technical skill from JD absent in resume>",
      "importance": "<critical|high|medium|low>",
      "category": "<Technical|Soft Skills|Tools|Domain Knowledge|Certifications>",
      "tip": "<one actionable sentence on how to demonstrate this skill>"
    }
  ],
  "resumeStrengths": [
    "<4-5 specific, concrete strengths citing actual resume content — NOT generic praise>"
  ],
  "improvementTips": [
    {
      "section": "<Work Experience|Skills|Summary|Education|Projects|Certifications>",
      "toAdd": ["<specific content to ADD — reference actual JD requirements missing from resume>"],
      "toRemove": ["<specific vague phrase to REMOVE/REWRITE — must quote or paraphrase actual resume text>"]
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
  "overallFeedback": "<2-3 sentence honest assessment of fit — reference specific resume vs JD gaps>",
  "industryBenchmark": <integer, typical ATS score for top candidates in this industry/role>
}

Mandatory rules:
- improvementTips must cover at least 3 sections (Work Experience, Skills, Summary minimum)
- Every improvementTips entry MUST have at least 1 item in both toAdd AND toRemove
- missingSkills: 4–10 items, all real technical skills
- matchedSkills: 4–12 items, only real technical skills found verbatim in both texts
- overallFeedback MUST mention at least one specific gap or strength by name`;

  try {
    const raw = await callGroq(prompt, { temperature: 0.75, maxTokens: 4096 });

    let rawResult: Record<string, unknown>;
    try {
      rawResult = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned invalid JSON. Please try again.");
      rawResult = JSON.parse(match[0]) as Record<string, unknown>;
    }

    const result: AnalysisResult = {
      atsScore: (rawResult.atsScore ?? rawResult.ats_score ?? 50) as number,
      keywordMatchRate: (rawResult.keywordMatchRate ?? rawResult.keyword_match_rate ?? 50) as number,
      industryBenchmark: (rawResult.industryBenchmark ?? rawResult.industry_benchmark ?? 70) as number,
      overallFeedback: (rawResult.overallFeedback ?? rawResult.overall_feedback ?? "Good start.") as string,
      matchedSkills: Array.isArray(rawResult.matchedSkills) ? rawResult.matchedSkills as string[] :
                     Array.isArray(rawResult.matched_skills) ? rawResult.matched_skills as string[] : [],
      missingSkills: Array.isArray(rawResult.missingSkills) ? rawResult.missingSkills as AnalysisResult["missingSkills"] :
                     Array.isArray(rawResult.missing_skills) ? rawResult.missing_skills as AnalysisResult["missingSkills"] : [],
      resumeStrengths: Array.isArray(rawResult.resumeStrengths) ? rawResult.resumeStrengths as string[] :
                       Array.isArray(rawResult.resume_strengths) ? rawResult.resume_strengths as string[] : [],
      improvementTips: Array.isArray(rawResult.improvementTips) ? rawResult.improvementTips as AnalysisResult["improvementTips"] :
                       Array.isArray(rawResult.improvement_tips) ? rawResult.improvement_tips as AnalysisResult["improvementTips"] : [],
      skillsToLearn: Array.isArray(rawResult.skillsToLearn) ? rawResult.skillsToLearn as AnalysisResult["skillsToLearn"] :
                     Array.isArray(rawResult.skills_to_learn) ? rawResult.skills_to_learn as AnalysisResult["skillsToLearn"] : [],
    };

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
  const email = authReq.userEmail ?? "";
  const name = email.split("@")[0] ?? "User";

  const { error: userErr } = await supabaseAdmin
    .from("users")
    .upsert({ id: userId, email, name }, { onConflict: "id", ignoreDuplicates: false });
  if (userErr) throw new Error(`[DB] Upsert user failed: ${userErr.message}`);

  const { data: resumeRow, error: resumeErr } = await supabaseAdmin
    .from("resumes")
    .insert({
      user_id: userId,
      parsed_content: { text: resumeText.slice(0, 8000), wordCount: resumeText.split(/\s+/).length },
    })
    .select("id")
    .single();
  if (resumeErr) throw new Error(`[DB] Insert resume failed: ${resumeErr.message}`);

  const { data: jdRow, error: jdErr } = await supabaseAdmin
    .from("job_descriptions")
    .insert({
      user_id: userId,
      company: company || "",
      role: role || "",
      parsed_requirements: { text: jobDescription.slice(0, 4000) },
    })
    .select("id")
    .single();
  if (jdErr) throw new Error(`[DB] Insert job_description failed: ${jdErr.message}`);

  const { error: analysisErr } = await supabaseAdmin
    .from("analyses")
    .insert({
      user_id: userId,
      resume_id: resumeRow.id,
      jd_id: jdRow.id,
      overall_match_score: result.atsScore,
      ai_report: result,
    });
  if (analysisErr) throw new Error(`[DB] Insert analysis failed: ${analysisErr.message}`);

  console.log(`[DB] Analysis saved for user ${userId} — ATS: ${result.atsScore}`);
}
