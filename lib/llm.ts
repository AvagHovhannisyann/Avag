import OpenAI from "openai";
import { HypothesisSchema, Hypothesis, ValuationInput } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import { demoHypothesis } from "./demoHypothesis";

// ─────────────────────────────────────────────────────────────────────────────
// Model abstraction. Talks to any OpenAI-compatible endpoint configured via env
// (Groq / Gemini / OpenRouter free tiers for prototyping; self-hosted DeepSeek
// or Qwen for private production). Falls back to a deterministic demo response
// when no API key is present, so the app is always runnable.
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateResult {
  hypothesis: Hypothesis;
  source: "model" | "demo";
  model: string;
}

function extractJson(raw: string): unknown {
  // Be tolerant of models that wrap JSON in prose or ```json fences.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in model output.");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function generateHypothesis(input: ValuationInput): Promise<GenerateResult> {
  const apiKey = process.env.LLM_API_KEY?.trim();
  const baseURL = process.env.LLM_BASE_URL?.trim();
  const model = process.env.LLM_MODEL?.trim() || "demo";

  // Demo mode: no key configured.
  if (!apiKey || !baseURL) {
    return { hypothesis: demoHypothesis(input), source: "demo", model: "demo" };
  }

  const client = new OpenAI({ apiKey, baseURL });

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = extractJson(raw);
  const hypothesis = HypothesisSchema.parse(parsed);
  return { hypothesis, source: "model", model };
}
