import OpenAI from "openai";
import { z } from "zod";
import { HypothesisSchema, Hypothesis, ValuationInput } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import { demoHypothesis } from "./demoHypothesis";
import { UploadedImage } from "./images";

// ─────────────────────────────────────────────────────────────────────────────
// Model abstraction. Talks to any OpenAI-compatible endpoint configured via env
// (Groq / Gemini / OpenRouter free tiers for prototyping; self-hosted DeepSeek
// or Qwen for private production). Every agent module calls llmJson() with its
// own system prompt, user prompt, schema and demo fallback — so the app is
// always runnable, even with no API key. Optional images are attached as
// vision content parts when a real (vision-capable) model is configured.
// ─────────────────────────────────────────────────────────────────────────────

export interface LlmJsonResult<T> {
  data: T;
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

export async function llmJson<T>(opts: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  demo: () => T;
  images?: UploadedImage[];
}): Promise<LlmJsonResult<T>> {
  const apiKey = process.env.LLM_API_KEY?.trim();
  const baseURL = process.env.LLM_BASE_URL?.trim();
  const model = process.env.LLM_MODEL?.trim() || "demo";

  // Demo mode: no key configured.
  if (!apiKey || !baseURL) {
    return { data: opts.demo(), source: "demo", model: "demo" };
  }

  const client = new OpenAI({ apiKey, baseURL });

  const images = opts.images ?? [];
  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: opts.user },
    ...images.map(
      (img): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
        type: "image_url",
        image_url: { url: img.dataUrl },
      }),
    ),
  ];

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: images.length ? userContent : opts.user },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const data = opts.schema.parse(extractJson(raw));
  return { data, source: "model", model };
}

// ── Phase 1 convenience wrapper (kept for the /api/generate route) ───────────

export interface GenerateResult {
  hypothesis: Hypothesis;
  source: "model" | "demo";
  model: string;
}

export async function generateHypothesis(input: ValuationInput): Promise<GenerateResult> {
  const result = await llmJson({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input),
    schema: HypothesisSchema,
    demo: () => demoHypothesis(input),
    images: input.images,
  });
  return { hypothesis: result.data, source: result.source, model: result.model };
}
