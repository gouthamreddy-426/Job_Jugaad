import type { Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

export async function getUserAnalyses(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("analyses")
      .select(`
        id,
        overall_match_score,
        ai_report,
        created_at,
        job_descriptions (
          company,
          role
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);

    const analyses = (rows ?? []).map((row) => {
      const report = (row.ai_report as Record<string, unknown>) ?? {};
      const jd = Array.isArray(row.job_descriptions)
        ? (row.job_descriptions[0] as { company?: string; role?: string } | undefined)
        : (row.job_descriptions as { company?: string; role?: string } | null);

      return {
        id: row.id,
        overallMatchScore: row.overall_match_score,
        company: jd?.company ?? "",
        role: jd?.role ?? "",
        createdAt: row.created_at,
        atsScore: (report.atsScore as number) ?? row.overall_match_score,
        keywordMatchRate: (report.keywordMatchRate as number) ?? 0,
        matchedSkills: (report.matchedSkills as string[]) ?? [],
        missingSkills: (report.missingSkills as Array<{ name: string; importance: string }>) ?? [],
        resumeStrengths: (report.resumeStrengths as string[]) ?? [],
        improvementTips: report.improvementTips ?? [],
        skillsToLearn: report.skillsToLearn ?? [],
        overallFeedback: (report.overallFeedback as string) ?? "",
        industryBenchmark: (report.industryBenchmark as number) ?? 70,
      };
    });

    res.json({ data: analyses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch analyses";
    console.error("[Analyses] Fetch error:", message);
    res.status(500).json({ error: message });
  }
}
