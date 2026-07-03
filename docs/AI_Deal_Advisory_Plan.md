# BDO Armenia — Deal Advisory AI Tools
## Analysis of the Technical Proposal & Build Plan

> Source: *DRAFT Technical Proposal on Use of AI tools — Deal Advisory*
> (Author: Aren Sukiasyan, BDO Armenia; draft rev. 217, May–Jul 2026)

---

## 1. What the proposal actually asks for

The document is a **scoping / strategy paper**, not a technical specification. It
identifies where AI can create tangible value inside BDO Armenia's **Deal
Advisory** practice and deliberately excludes reporting/analysis/research
(those are covered by the Management Consulting — "MC" — proposal).

It defines **three priority areas**:

### A. Valuation Hypothesis Agent  *(stated top priority)*
Supports a consultant in forming an **initial valuation logic** from available
financial, operational, market and industry information. It produces a
structured first draft:
- proposed valuation approach
- key value drivers
- relevant assumptions
- comparable benchmarks
- possible risk areas
- questions requiring professional review

The consultant then **challenges, tests, amends, accepts or rejects** it.
Goal: consistency across assignments + a disciplined starting point, **without
replacing professional judgment**.

### B. Financial Modeling & Business Planning (one integrated workstream)
AI supports building a *standardized, consistent, reliable* financial model for:
- **Existing business / valuation** — input = client financials, management
  accounts, budgets, forecasts → normalize, structure, challenge, prepare
  valuation-ready model inputs.
- **New project / feasibility** — input = market research, benchmarks, technical
  assumptions, interviews → develop & benchmark assumptions, support the
  business-plan financial model.

Main functions: normalize statements · structure assumptions · build
revenue/OPEX/CAPEX/working-capital/debt/tax logic · identify inconsistencies ·
check formulas & model links · scenario & sensitivity analysis · draft the
financial-plan narrative · keep **Excel model ↔ Word report ↔ PPT** consistent.
Output: standardized financial-model structure + financial-plan narrative.

### C. Tangible Asset Valuation
Structured workflow: market-data collection → filtering → adjustment logic →
calculation → consistency checks → report drafting. Specifically:
- collect market data from listings/ads/announcements, with **links, date,
  country, VAT in/out, currency**;
- compute transportation, customs and other price adjustments;
- build adjustment logic vs. the subject asset (condition, age, wear & tear);
- flag outliers / missing data / inconsistencies;
- keep model ↔ calculations ↔ report narrative consistent;
- draft report sections from approved templates; align with valuation standards.
Output: comparable-data table (in the Valuation team's template) + adjustment
logic + finalized fair/market value calc + draft report sections.

### Cross-cutting: Functional vs. Sectoral
Start with **functional agents** (valuation, financial modeling, benchmarking,
WACC, report drafting) as the foundation, then layer **sectoral knowledge**
(renewable energy, agriculture, healthcare, retail, manufacturing, real estate).

### Non-negotiable principle (repeated throughout)
Every AI output is a **preliminary working material**. Final approaches,
assumptions, calculations, conclusions and reports stay subject to professional
review, source validation and internal QC.

---

## 2. What the reviewer's comments tell us (important nuance)

Aren's 7 margin comments shape scope:
1. Business **valuation** and business **planning** should be **two separate
   sections** — valuation isn't only the income approach (also market & cost
   approaches); business planning is more than financial planning (product,
   marketing, etc.).
2. Some items belong in **MC's proposal**, not this one.
3. He explicitly questions whether *certain* tasks should be given to AI at all
   ("Are we sure this task should be allocated to AI?").
4. Some items should be handled as an internal **imperative**, not written into
   the client-facing document.

**Implication for us:** the scope is still being negotiated internally. We should
build **modularly** so pieces can be included/excluded without rework, and we
should keep valuation vs. planning cleanly separated in the architecture.

---

## 3. Product vision

A **privacy-first, human-in-the-loop assistant suite** for Deal Advisory. Not an
autopilot — a "structured first-draft generator" with an explicit
accept / amend / reject step on every output, and a full audit trail.

Design pillars:
1. **Human-in-the-loop by default** — nothing is final; every element is
   reviewable and editable.
2. **Confidentiality first** — client financials are highly sensitive. The model
   layer must be swappable and self-hostable so data need never leave BDO
   infrastructure in production.
3. **Structured, template-aligned output** — outputs map to the Valuation team's
   existing Excel/Word/PPT templates.
4. **Traceability** — every assumption/comparable carries its source, date and
   rationale (the proposal is explicit about this for tangible assets).
5. **Modular agents** — functional core first, sectoral knowledge layered on.

---

## 4. Recommended AI model (the "free model best at the job")

Because BDO handles **confidential client financials**, "best" ≠ "smartest cloud
model." It means **strong financial/quantitative reasoning + open weights that
can be self-hosted** so data stays private.

| Tier | Recommendation | Why |
|---|---|---|
| **Production (self-hosted, private)** | **DeepSeek-R1** (reasoning) / **DeepSeek-V3** (fast general) | Top-tier reasoning & math, open weights → run on BDO infra, client data never leaves. Free to use (open license). |
| **Strong alternative** | **Qwen2.5-72B / Qwen3** | Excellent math/finance, open weights, good structured-output adherence. |
| **Prototype (free API, non-confidential/synthetic data only)** | **Google Gemini 2.0 Flash (free tier)** or **Groq**-hosted Llama/Qwen (free) | Fast, zero-cost iteration while we validate the workflow with dummy data. |

**Approach:** build against an **OpenAI-compatible API abstraction** so we can
start on a free cloud tier with synthetic data, then swap to a self-hosted
DeepSeek/Qwen for real client work — no code changes. Reasoning-heavy steps
(valuation logic, adjustment logic) use the reasoning model; drafting/formatting
steps use the faster model.

---

## 5. Phased roadmap

### Phase 0 — Foundations (decisions + scaffold)
- Confirm MVP slice, deployment/privacy constraint, tech stack.
- Stand up repo, model abstraction, prompt/eval harness, synthetic test data.

### Phase 1 — MVP: **Valuation Hypothesis Agent** *(the proposal's #1 priority)*
The most self-contained, highest-visibility slice.
- Input: company profile, sector, purpose of valuation, financials
  (paste/upload), market/industry context.
- Pipeline → structured hypothesis: approach · value drivers · assumptions ·
  comparable benchmarks · risk areas · questions for review.
- Human-in-the-loop UI: accept / amend / reject each element; add rationale.
- Export to Word/PPT; full audit trail of what the AI proposed vs. what the
  consultant decided.

### Phase 2 — **Financial Model Assumptions & Normalization** assistant
- Normalize statements, structure assumptions (revenue/OPEX/CAPEX/WC/debt/tax),
  consistency checks, scenario & sensitivity, draft financial-plan narrative.
- Excel integration (read/write against the team's template).

### Phase 3 — **Tangible Asset Valuation** agent
- Market-data collection + comparable table (link/date/country/VAT/currency),
  price adjustments (transport/customs), adjustment logic (condition/age/wear),
  outlier flagging, draft report sections in template.

### Phase 4 — **Sectoral layers + shared utilities**
- Benchmarking, WACC calculator, cross-document (Excel↔Word↔PPT) consistency
  checker; sectoral knowledge packs for priority industries.

### Cross-cutting from day one
Confidentiality/self-hosting path · audit trail · template alignment ·
evaluation harness (accuracy/consistency scoring on a test set).

---

## 6. Suggested tech stack (for discussion)

- **Frontend/app:** web app (Next.js/React) — fast to demo, easy to host.
- **Backend:** Python (FastAPI) — best ecosystem for finance/model logic,
  Excel (openpyxl), document generation (python-docx, python-pptx).
- **Model layer:** OpenAI-compatible client → free API tier for prototype,
  self-hosted DeepSeek/Qwen (vLLM/Ollama) for production.
- **Knowledge/RAG:** vector store over BDO templates, valuation standards,
  prior anonymized assignments.
- **Data handling:** strict separation; no real client data through third-party
  APIs until self-hosted model is in place.

---

## 7. Open decisions (need input before Phase 1 build)

1. **Which slice first?** Recommend the **Valuation Hypothesis Agent** (proposal's
   #1 priority, most self-contained, best demo).
2. **Deployment / data privacy for the prototype:** can we prototype on a free
   cloud API with **synthetic/dummy data**, then move to self-hosted for real
   client data? (Recommended.)
3. **Primary interface:** standalone **web app** vs. **Excel add-in** vs. desktop
   tool. (Recommend web app for the MVP.)
