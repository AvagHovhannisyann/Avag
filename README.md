# BDO Armenia — Deal Advisory AI Suite

An AI-supported, **human-in-the-loop** workbench for BDO Armenia's Deal
Advisory practice, built from the internal *Technical Proposal — Use of AI
Tools in Valuation and Financial Modeling*. Four modules cover the full
roadmap in [`docs/AI_Deal_Advisory_Plan.md`](docs/AI_Deal_Advisory_Plan.md):

| Phase | Module | What it does |
|---|---|---|
| 1 | **Valuation Hypothesis Agent** (`/hypothesis`) | Initial valuation logic — approaches across income/market/cost, value drivers, assumptions, comparables, risk areas, WACC considerations, questions for review — each element accepted / amended / rejected by the consultant. |
| 2 | **Financial Model & Business Plan** (`/financial-model`) | Two tracks (existing business valuation · new project business plan): normalization adjustments, six-category assumption book (revenue, OPEX, CAPEX, working capital, debt, tax), consistency checks, scenarios, sensitivities and the financial-plan narrative. |
| 3 | **Tangible Asset Valuation** (`/tangible-assets`) | Structures pasted listings into a comparables table (source, price, currency, VAT, country, date), proposes adjustment guidance (transport, customs, condition, age/wear) and drafts report sections. A **deterministic calculation table** (FX → net-of-VAT → adjustments) computes the indicated range — every figure consultant-controlled. |
| 4 | **Toolkit & Sector Knowledge** (`/toolkit`) | Deterministic WACC build-up calculator, six sector knowledge packs (renewable energy, agriculture, healthcare, retail, manufacturing, real estate) injected into agent prompts, and an Excel↔Word↔PowerPoint consistency checker. |

Every module exports **Word working papers** (`docx`) and, where relevant,
**Excel workbooks** (`exceljs`) — including a standardized financial model
skeleton and the comparables calculation sheet. Each export is labelled a
preliminary working material.

## Guiding principle

> All AI-generated outputs are preliminary working materials, subject to
> professional review, source validation and internal quality control. They do
> not replace professional judgment or constitute a final valuation.

The AI never concludes a value, never invents evidence (comparables come only
from the consultant's collected listings), and every proposed element carries
an explicit accept / amend / reject decision with reviewer notes — a full
audit trail from proposal to working paper.

## Quick start

```bash
npm install
cp .env.example .env      # optional — leave empty to run in DEMO MODE
npm run dev               # http://localhost:3000
```

Click **"Load sample"** in any module to try the full flow with dummy data.
With no API key configured, realistic sample outputs let you demo offline.

## Choosing the model (the "best free model" for the job)

Because this touches **confidential client financials**, "best" means *strong
financial reasoning* **and** *self-hostable* so data stays private. The app
talks to any **OpenAI-compatible** endpoint via three env vars — start free,
swap to private production with **no code changes**:

| Stage | `LLM_BASE_URL` | `LLM_MODEL` | Notes |
|---|---|---|---|
| Prototype (free) | Groq / Gemini / OpenRouter | `llama-3.3-70b` / `gemini-2.0-flash` / `deepseek/deepseek-r1:free` | **Dummy data only.** |
| Production (private) | self-hosted vLLM/Ollama | `deepseek-ai/DeepSeek-R1` or `Qwen2.5-72B` | Open weights → client data never leaves BDO infra. |

See [`.env.example`](.env.example) for ready-to-uncomment options.

> ⚠️ Do **not** send real, confidential client data to a third-party API. Use
> synthetic/dummy data for prototyping; move to a self-hosted open model before
> any real engagement.

## Tech

Next.js 14 (App Router) · TypeScript · Tailwind CSS · **shadcn/ui-style
component system** (BDO navy/red design tokens, Radix primitives, lucide
icons) · `openai` client (any OpenAI-compatible endpoint) · `zod` schema
validation · `docx` Word export · `exceljs` Excel export.

## Project layout

```
app/
  page.tsx                     # dashboard
  hypothesis/page.tsx          # Phase 1
  financial-model/page.tsx     # Phase 2
  tangible-assets/page.tsx     # Phase 3
  toolkit/page.tsx             # Phase 4 (WACC · sectors · consistency)
  api/
    generate/route.ts          # Phase 1 LLM call
    financial-model/route.ts   # Phase 2 LLM call
    tangible/route.ts          # Phase 3 LLM call
    consistency/route.ts       # Phase 4 LLM call
    export/route.ts            # Word working-paper export
    export-excel/route.ts      # Excel export (+ model skeleton sheet)
lib/
  llm.ts                       # OpenAI-compatible abstraction + demo fallback
  types.ts / prompt.ts / demoHypothesis.ts    # Phase 1 domain
  finmodel.ts                  # Phase 2 domain (schemas · prompt · demo)
  tangible.ts / tangibleCalc.ts               # Phase 3 domain + calc engine
  consistency.ts               # Phase 4 checker domain
  sectors.ts                   # sector knowledge packs
  review.ts                    # accept/amend/reject flattening
components/
  ui/                          # shadcn-style kit (button, card, tabs, …)
  ReviewBoard.tsx · ElementCard.tsx · ComparablesTable.tsx
  WaccCalculator.tsx · HypothesisForm.tsx · BdoLogo.tsx · NavLinks.tsx
docs/
  AI_Deal_Advisory_Plan.md     # analysis of the proposal + roadmap
```

## Verification

- `npm run build` — compiles clean with strict TypeScript.
- All 5 pages and 6 API routes exercised end-to-end (demo mode): structured
  outputs validate against their zod schemas; Word/Excel exports produce valid
  Office files; error paths return clean 400s.
- Comparables math independently checked: `71,500 EUR incl. VAT × FX 1.08 →
  net 64,350 → −2% adjustments → 63,063`.
