import type { AnalysisResult, PracticeData } from "@/types/analysis";

const BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : "";

let getTokenFn: (() => Promise<string | null>) | null = null;

export function setTokenProvider(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

async function buildHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (getTokenFn) {
    const token = await getTokenFn();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const headers = await buildHeaders();
  const res = await fetch(`${BASE}/api${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json() as { data?: T; error?: string };
  if (!res.ok || json.error) throw new Error(json.error ?? `Request failed: ${res.status}`);
  return json.data as T;
}

async function get<T>(path: string): Promise<T> {
  const headers = await buildHeaders();
  const res = await fetch(`${BASE}/api${path}`, { headers });
  const json = await res.json() as { data?: T; error?: string };
  if (!res.ok || json.error) throw new Error(json.error ?? `Request failed: ${res.status}`);
  return json.data as T;
}

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  company = "",
  role = ""
): Promise<AnalysisResult> {
  return post<AnalysisResult>("/analyze", { resumeText, jobDescription, company, role });
}

export async function generatePractice(
  jobDescription: string,
  missingSkills: string[],
  jobTitle?: string,
  overallFeedback?: string
): Promise<PracticeData> {
  return post<PracticeData>("/practice", {
    jobDescription,
    missingSkills,
    jobTitle: jobTitle ?? "Software Engineer",
    overallFeedback: overallFeedback ?? "",
  });
}

export async function getUserAnalyses(): Promise<unknown[]> {
  return get<unknown[]>("/analyses");
}
