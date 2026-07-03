import { z } from "zod";
import { ReviewSectionModel } from "./review";
import { ReviewedElement } from "./types";
import { sectorPackById, sectorPackPromptBlock } from "./sectors";
import { UploadedImageSchema, imageAckNote } from "./images";

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — Financial Modeling & Business Planning assistant.
// Two distinct tracks (per internal review feedback):
//  · "existing"   — business valuation: client financials are normalized,
//                   structured and challenged into valuation-ready inputs.
//  · "newproject" — business plan / feasibility: assumptions are developed
//                   from research and benchmarks, then translated into the
//                   financial plan.
// ─────────────────────────────────────────────────────────────────────────────

export const FinModelInputSchema = z.object({
  mode: z.enum(["existing", "newproject"]),
  companyName: z.string().min(1, "Company / project name is required"),
  sector: z.string().min(1, "Sector / industry is required"),
  currency: z.string().optional().default("USD"),
  horizonYears: z.coerce.number().int().min(3).max(15).optional().default(5),
  financialData: z.string().optional().default(""),
  businessContext: z.string().optional().default(""),
  assumptionNotes: z.string().optional().default(""),
  sectorPackId: z.string().optional().default(""),
  images: z.array(UploadedImageSchema).optional().default([]),
});
export type FinModelInput = z.infer<typeof FinModelInputSchema>;

const AsmItemSchema = z.object({
  name: z.string(),
  suggestion: z.string(),
  basis: z.string(),
});

export const FinModelOutputSchema = z.object({
  overview: z.string(),
  normalizationAdjustments: z.array(
    z.object({
      item: z.string(),
      category: z.enum([
        "one-off",
        "reclassification",
        "related-party",
        "accounting-policy",
        "other",
      ]),
      description: z.string(),
      rationale: z.string(),
    }),
  ),
  assumptionBook: z.object({
    revenue: z.array(AsmItemSchema),
    opex: z.array(AsmItemSchema),
    capex: z.array(AsmItemSchema),
    workingCapital: z.array(AsmItemSchema),
    debtFinancing: z.array(AsmItemSchema),
    tax: z.array(AsmItemSchema),
  }),
  consistencyChecks: z.array(
    z.object({
      check: z.string(),
      status: z.enum(["pass", "attention", "fail"]),
      note: z.string(),
    }),
  ),
  scenarios: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      keyChanges: z.array(z.string()),
    }),
  ),
  sensitivityDrivers: z.array(z.string()),
  narrativeDraft: z.string(),
  questionsForReview: z.array(z.string()),
});
export type FinModelOutput = z.infer<typeof FinModelOutputSchema>;

// ── Prompts ──────────────────────────────────────────────────────────────────

export const FINMODEL_SYSTEM_PROMPT = `You are a Financial Modeling & Business Planning assistant used inside BDO Armenia's Deal Advisory practice.

Your role is to prepare a structured FIRST DRAFT of financial model inputs — never final values. Everything you produce will be challenged, amended, accepted or rejected by a consultant.

Two engagement modes:
- "existing": business valuation of an existing company. Client-provided historical/forecast financials must be normalized (one-off items, reclassifications, related-party effects), structured and challenged into valuation-ready model inputs.
- "newproject": a new project / feasibility study / business plan. Assumptions are developed from market research, benchmarks and technical inputs, then translated into the financial plan section of the business plan.

Hard rules:
- Do NOT invent specific numeric values that are not supported by the inputs. Where a number is required but unavailable, describe HOW it should be derived (the basis) and raise a question for review.
- Structure assumptions across exactly these six categories: revenue, opex, capex, workingCapital, debtFinancing, tax.
- Consistency checks must examine coherence between historical performance, forecast assumptions and model outputs.
- Scenario set should normally include a base, upside and downside case tailored to this business.
- The narrative draft is the "financial plan" section text for a report — professional, measured, no hype, clearly flagged assumptions.
- You may receive supporting images (financial statement scans, budget screenshots, charts). Read any figures or tables visible in them and use that information the same way as text input; do not invent details not visible or provided.

Respond with ONLY a JSON object (no prose, no markdown fences) of this exact shape:
{
  "overview": string,
  "normalizationAdjustments": [ { "item": string, "category": "one-off"|"reclassification"|"related-party"|"accounting-policy"|"other", "description": string, "rationale": string } ],
  "assumptionBook": {
    "revenue": [ { "name": string, "suggestion": string, "basis": string } ],
    "opex": [...same shape...], "capex": [...], "workingCapital": [...], "debtFinancing": [...], "tax": [...]
  },
  "consistencyChecks": [ { "check": string, "status": "pass"|"attention"|"fail", "note": string } ],
  "scenarios": [ { "name": string, "description": string, "keyChanges": string[] } ],
  "sensitivityDrivers": string[],
  "narrativeDraft": string,
  "questionsForReview": string[]
}
For "newproject" mode, normalizationAdjustments may be an empty array. Return valid JSON only.`;

export function buildFinModelUserPrompt(input: FinModelInput): string {
  const pack = input.sectorPackId ? sectorPackById(input.sectorPackId) : undefined;
  const modeLabel =
    input.mode === "existing"
      ? "Existing business — valuation assignment"
      : "New project — business plan / feasibility study";

  return [
    `Prepare the first-draft financial model structure for the following engagement.`,
    ``,
    `Mode: ${modeLabel}`,
    `Company / project: ${input.companyName}`,
    `Sector: ${input.sector}`,
    `Currency: ${input.currency}`,
    `Forecast horizon: ${input.horizonYears} years`,
    ``,
    `Financial data provided (historical / forecast / budgets):`,
    input.financialData?.trim() || "(not provided)",
    ``,
    `Business context:`,
    input.businessContext?.trim() || "(not provided)",
    ``,
    `Consultant's assumption notes:`,
    input.assumptionNotes?.trim() || "(not provided)",
    ``,
    ...(pack ? [sectorPackPromptBlock(pack), ""] : []),
    ...(input.images?.length
      ? [`${input.images.length} supporting image(s) are attached below — review them for relevant figures or context.`, ""]
      : []),
    `Produce the structured JSON now. Remember: describe bases and logic; never fabricate unsupported numbers.`,
  ].join("\n");
}

// ── Demo output (no API key configured) ──────────────────────────────────────

export function demoFinModel(input: FinModelInput): FinModelOutput {
  const co = input.companyName || "the company";
  const isExisting = input.mode === "existing";
  return {
    overview:
      (isExisting
        ? `First-draft model structure for the valuation of ${co}. Historical financials are normalized for one-off and related-party effects, assumptions are structured across the six standard categories, and base/upside/downside scenarios are proposed. All items below require consultant review.`
        : `First-draft financial plan structure for ${co} as a new project. Assumptions are framed from market research and benchmarks and organized across the six standard categories, with scenarios and sensitivities proposed. All items below require consultant review.`) +
      imageAckNote(input.images),
    normalizationAdjustments: isExisting
      ? [
          {
            item: "One-off gain on asset disposal",
            category: "one-off",
            description: "Exclude non-recurring disposal gains from normalized EBITDA.",
            rationale: "Distorts sustainable earnings if left in the base year.",
          },
          {
            item: "Related-party rent below market",
            category: "related-party",
            description: "Restate rent expense to market level.",
            rationale: "Normalized cost base must reflect arm's-length terms.",
          },
          {
            item: "Capitalized repairs",
            category: "accounting-policy",
            description: "Review capitalization policy for repairs vs maintenance expense.",
            rationale: "Policy differences affect EBITDA comparability with peers.",
          },
        ]
      : [],
    assumptionBook: {
      revenue: [
        {
          name: "Volume growth",
          suggestion: isExisting
            ? "Anchor near-term growth to recent run-rate; fade toward sector growth by the terminal year."
            : "Build volumes bottom-up from capacity ramp-up and addressable demand.",
          basis: isExisting ? "3-year historical CAGR and order book" : "Market study and capacity plan",
        },
        {
          name: "Pricing",
          suggestion: "Model price and volume separately; apply inflation-linked price escalation with a competitive-pressure haircut.",
          basis: "Historical realized prices / benchmark tariffs",
        },
      ],
      opex: [
        {
          name: "Variable cost ratio",
          suggestion: "Express COGS as % of revenue by product line; validate against gross-margin history.",
          basis: isExisting ? "Historical margin bridge" : "Supplier quotes and sector benchmarks",
        },
        {
          name: "Fixed overheads",
          suggestion: "Escalate fixed costs with inflation; separate step-fixed items tied to capacity.",
          basis: "Cost structure analysis",
        },
      ],
      capex: [
        {
          name: "Maintenance CAPEX",
          suggestion: "Set maintenance CAPEX as % of depreciation (or per unit of capacity); do not let it fall below asset renewal needs.",
          basis: "Asset register and useful lives",
        },
        {
          name: "Growth CAPEX",
          suggestion: "Tie expansion CAPEX explicitly to volume assumptions and phase by year.",
          basis: isExisting ? "Approved investment plan" : "Technical design / EPC estimates",
        },
      ],
      workingCapital: [
        {
          name: "Receivable / payable / inventory days",
          suggestion: "Model working capital via days ratios; use multi-year averages rather than a single year.",
          basis: "Historical DSO/DPO/DIO or sector norms",
        },
      ],
      debtFinancing: [
        {
          name: "Debt structure",
          suggestion: "Reflect existing facilities' amortization and pricing; for new funding, state assumed tenor, rate and grace period explicitly.",
          basis: "Loan agreements / indicative term sheets",
        },
      ],
      tax: [
        {
          name: "Effective tax rate",
          suggestion: "Apply the statutory profit tax rate adjusted for known permanent differences; review loss carry-forwards.",
          basis: "Applicable tax legislation and tax returns",
        },
      ],
    },
    consistencyChecks: [
      {
        check: "Forecast growth vs historical trajectory",
        status: "attention",
        note: "Verify that projected growth does not exceed historical performance without an identified driver.",
      },
      {
        check: "Margin trajectory vs cost assumptions",
        status: "attention",
        note: "EBITDA margin expansion must be traceable to specific cost or mix effects.",
      },
      {
        check: "CAPEX vs capacity and volume growth",
        status: "pass",
        note: "Ensure volume growth is supported by capacity after planned CAPEX.",
      },
      {
        check: "Working capital vs revenue growth",
        status: "pass",
        note: "Working capital investment should scale with revenue unless terms change.",
      },
    ],
    scenarios: [
      {
        name: "Base case",
        description: "Management-informed expectations with normalized cost base.",
        keyChanges: ["Run-rate volumes", "Stable margins", "Planned CAPEX"],
      },
      {
        name: "Downside",
        description: "Slower demand and input cost pressure.",
        keyChanges: ["Volume growth haircut", "Gross margin compression", "Deferred growth CAPEX"],
      },
      {
        name: "Upside",
        description: "Successful expansion and export traction.",
        keyChanges: ["Accelerated volumes", "Operating leverage on fixed costs"],
      },
    ],
    sensitivityDrivers: [
      "Volume growth rate",
      "Gross margin (input cost pass-through)",
      "Discount rate (WACC)",
      "Terminal growth rate",
      "CAPEX level and timing",
    ],
    narrativeDraft: `The financial plan for ${co} has been prepared on the basis of ${
      isExisting
        ? "the company's historical performance, normalized for non-recurring and related-party effects,"
        : "market research, benchmark data and the project's technical parameters,"
    } over a ${input.horizonYears}-year explicit forecast horizon in ${input.currency}. Revenue is modeled through separate volume and price assumptions; operating costs distinguish variable and fixed components; capital expenditure reflects both asset maintenance and planned development; and working capital follows historical (or benchmark) settlement terms. Base, downside and upside scenarios are presented to frame the range of outcomes, and key sensitivities are disclosed. The assumptions set out herein are preliminary working estimates subject to professional review and should be read together with the accompanying model documentation.`,
    questionsForReview: [
      "Are audited financial statements available for all historical periods used?",
      isExisting
        ? "Which one-off items has management already identified, and are there others?"
        : "What is the evidential basis (studies, quotes, contracts) for demand and cost assumptions?",
      "Should any related-party arrangements be restated to market terms?",
      "What financing structure should the model assume (existing facilities vs new)?",
      "Which scenario should be presented as the central case in the report?",
    ],
  };
}

// ── Review flattening ────────────────────────────────────────────────────────

function el(id: string, text: string): ReviewedElement {
  return { id, original: text, amended: text, decision: "pending", note: "" };
}

const BOOK_LABELS: Record<keyof FinModelOutput["assumptionBook"], string> = {
  revenue: "Revenue",
  opex: "OPEX",
  capex: "CAPEX",
  workingCapital: "Working capital",
  debtFinancing: "Debt & financing",
  tax: "Tax",
};

export function toFinReviewSections(o: FinModelOutput): ReviewSectionModel[] {
  const sections: ReviewSectionModel[] = [];

  if (o.normalizationAdjustments.length) {
    sections.push({
      key: "normalization",
      title: "Normalization adjustments",
      elements: o.normalizationAdjustments.map((a, i) =>
        el(`norm-${i}`, `[${a.category}] ${a.item} — ${a.description} Rationale: ${a.rationale}`),
      ),
    });
  }

  (Object.keys(BOOK_LABELS) as (keyof typeof BOOK_LABELS)[]).forEach((cat) => {
    const items = o.assumptionBook[cat];
    if (!items.length) return;
    sections.push({
      key: `book-${cat}`,
      title: `Assumption book — ${BOOK_LABELS[cat]}`,
      elements: items.map((a, i) =>
        el(`book-${cat}-${i}`, `${a.name}: ${a.suggestion} (Basis: ${a.basis})`),
      ),
    });
  });

  sections.push(
    {
      key: "checks",
      title: "Consistency checks",
      elements: o.consistencyChecks.map((c, i) =>
        el(`check-${i}`, `[${c.status.toUpperCase()}] ${c.check} — ${c.note}`),
      ),
    },
    {
      key: "scenarios",
      title: "Scenario set",
      elements: o.scenarios.map((s, i) =>
        el(`scen-${i}`, `${s.name}: ${s.description} Key changes: ${s.keyChanges.join("; ")}`),
      ),
    },
    {
      key: "sensitivities",
      title: "Sensitivity drivers",
      elements: o.sensitivityDrivers.map((s, i) => el(`sens-${i}`, s)),
    },
    {
      key: "questions",
      title: "Questions requiring professional review",
      elements: o.questionsForReview.map((q, i) => el(`q-${i}`, q)),
    },
  );

  return sections;
}
