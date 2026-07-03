# BDO Armenia — Deal Advisory · Valuation Hypothesis Agent (MVP)

An AI-supported assistant that helps a valuation consultant form an **initial,
structured valuation hypothesis** from engagement inputs. It is a disciplined
*starting point* — **not** a final valuation. Every element the AI proposes can
be **accepted, amended, or rejected** by the consultant, and the reviewed output
exports to a Word working paper.

Built from the *Technical Proposal — Deal Advisory: Use of AI Tools in Valuation
and Financial Modeling* (BDO Armenia). This is **Phase 1** of the roadmap in
[`docs/AI_Deal_Advisory_Plan.md`](docs/AI_Deal_Advisory_Plan.md).

## What it does

Given company, sector, purpose, financial summary and market context, it produces:
- proposed valuation **approaches** (Income / Market / Cost — ranked)
- key **value drivers**
- key **assumptions** (with basis & rationale)
- **comparable** benchmarks
- **risk areas**
- **WACC / discount-rate** considerations
- **questions requiring professional review**

…each as a reviewable card with Accept / Amend / Reject + reviewer notes, a
live review scoreboard, and one-click **Export to Word**.

## Guiding principle

> All AI-generated outputs are preliminary working materials, subject to
> professional review, source validation and internal quality control. They do
> not replace professional judgment or constitute a final valuation.

## Quick start

```bash
npm install
cp .env.example .env      # optional — leave empty to run in DEMO MODE
npm run dev               # http://localhost:3000
```

Click **"Load sample (dummy data)"** → **"Generate hypothesis"** to try the full
flow. With no API key it returns a realistic sample so you can demo offline.

## Choosing the model (the "best free model" for the job)

Because this touches **confidential client financials**, "best" means *strong
financial reasoning* **and** *self-hostable* so data stays private. The app talks
to any **OpenAI-compatible** endpoint via three env vars, so you can start free
and swap to private production later with **no code changes**:

| Stage | `LLM_BASE_URL` | `LLM_MODEL` | Notes |
|---|---|---|---|
| Prototype (free) | Groq / Gemini / OpenRouter | `llama-3.3-70b` / `gemini-2.0-flash` / `deepseek/deepseek-r1:free` | **Dummy data only.** |
| Production (private) | self-hosted vLLM/Ollama | `deepseek-ai/DeepSeek-R1` or `Qwen2.5-72B` | Open weights → client data never leaves BDO infra. |

See [`.env.example`](.env.example) for ready-to-uncomment options.

> ⚠️ Do **not** send real, confidential client data to a third-party API. Use
> synthetic/dummy data for prototyping; move to a self-hosted open model before
> any real engagement.

## Tech

Next.js 14 (App Router) · TypeScript · Tailwind · `openai` client (any
OpenAI-compatible endpoint) · `zod` schema validation · `docx` for Word export.

## Project layout

```
app/
  page.tsx              # main UI: form → review → export
  api/generate/route.ts # LLM call → structured hypothesis (demo fallback)
  api/export/route.ts   # Word (.docx) working-paper export
lib/
  prompt.ts             # system prompt + user prompt builder
  types.ts              # zod schemas (input + hypothesis + review state)
  llm.ts                # OpenAI-compatible model abstraction
  review.ts             # flatten hypothesis → reviewable elements
  demoHypothesis.ts     # offline sample
components/
  HypothesisForm.tsx · ElementCard.tsx
docs/
  AI_Deal_Advisory_Plan.md  # full analysis of the proposal + roadmap
```

## Roadmap (next phases)

- **Phase 2** — Financial-model normalization & assumptions assistant (Excel).
- **Phase 3** — Tangible Asset Valuation agent (comparables + adjustment logic).
- **Phase 4** — Sectoral knowledge layers, WACC/benchmarking utilities,
  Excel↔Word↔PPT consistency checks.
