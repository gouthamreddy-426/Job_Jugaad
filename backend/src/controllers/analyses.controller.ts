import type { Response } from "express";
import { query } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";

export async function getUserAnalyses(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT
         a.id,
         a.overall_match_score,
         a.ai_report,
         a.created_at,
         j.company,
         j.role
       FROM analyses a
       LEFT JOIN job_descriptions j ON a.jd_id = j.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT 20`,
      [userId]
    );

    const analyses = rows.map((row) => {
      const report = row.ai_report as Record<string, unknown> ?? {};
      return {
        id: row.id,
        overallMatchScore: row.overall_match_score,
        company: row.company ?? "",
        role: row.role ?? "",
        createdAt: row.created_at,
        atsScore: report.atsScore ?? row.overall_match_score,
        keywordMatchRate: report.keywordMatchRate,
        matchedSkills: report.matchedSkills ?? [],
        missingSkills: report.missingSkills ?? [],
        resumeStrengths: report.resumeStrengths ?? [],
        improvementTips: report.improvementTips ?? [],
        skillsToLearn: report.skillsToLearn ?? [],
        overallFeedback: report.overallFeedback ?? "",
        industryBenchmark: report.industryBenchmark,
      };
    });

    res.json({ data: analyses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch analyses";
    res.status(500).json({ error: message });
  }
}
