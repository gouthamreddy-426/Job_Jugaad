const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export async function callGroq(prompt: string, options: { maxTokens?: number; temperature?: number } = {}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY environment variable is not set.");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a strict ATS scoring engine. You produce fresh, document-specific analysis every time. You never repeat prior scores. You never produce round numbers unless they are genuinely correct. You always base scores on the actual keyword overlap between the provided resume and job description.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.75,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  const raw = data.choices?.[0]?.message?.content ?? "";
  return raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}
