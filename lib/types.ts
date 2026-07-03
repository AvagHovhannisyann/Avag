import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Input: the information a consultant provides to seed a valuation hypothesis.
// Kept deliberately light — the agent produces a *starting point*, not a final
// valuation. Everything downstream is reviewed by the consultant.
// ─────────────────────────────────────────────────────────────────────────────
export const ValuationInputSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  sector: z.string().min(1, "Sector / industry is required"),
  country: z.string().optional().default(""),
  currency: z.string().optional().default("USD"),
  valuationDate: z.string().optional().default(""),
  valuationPurpose: z.string().optional().default(""),
  businessDescription: z.string().optional().default(""),
  financialSummary: z.string().optional().default(""),
  marketContext: z.string().optional().default(""),
  sectorPackId: z.string().optional().default(""),
});
export type ValuationInput = z.infer<typeof ValuationInputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Output: the structured hypothesis. Mirrors the proposal's required elements:
// proposed valuation approach, key value drivers, relevant assumptions,
// comparable benchmarks, possible risk areas, and questions requiring review.
// Aren's review note is honoured: approaches cover income / market / cost, not
// only the income approach.
// ─────────────────────────────────────────────────────────────────────────────
export const ApproachSchema = z.object({
  approach: z.enum(["Income", "Market", "Cost", "Other"]),
  method: z.string(), // e.g. "DCF", "Guideline Public Company", "Net Asset Value"
  rationale: z.string(),
  priority: z.enum(["Primary", "Secondary", "Cross-check"]),
});

export const AssumptionSchema = z.object({
  name: z.string(),
  basis: z.string(), // where it comes from / how it was derived
  rationale: z.string(),
});

export const ComparableSchema = z.object({
  name: z.string(),
  type: z.enum(["Company", "Transaction", "Multiple", "Benchmark"]),
  relevance: z.string(),
});

export const RiskSchema = z.object({
  area: z.string(),
  description: z.string(),
  severity: z.enum(["High", "Medium", "Low"]),
});

export const HypothesisSchema = z.object({
  summary: z.string(),
  approaches: z.array(ApproachSchema),
  valueDrivers: z.array(z.string()),
  assumptions: z.array(AssumptionSchema),
  comparables: z.array(ComparableSchema),
  riskAreas: z.array(RiskSchema),
  waccConsiderations: z.array(z.string()),
  questionsForReview: z.array(z.string()),
});
export type Hypothesis = z.infer<typeof HypothesisSchema>;
export type Approach = z.infer<typeof ApproachSchema>;
export type Assumption = z.infer<typeof AssumptionSchema>;
export type Comparable = z.infer<typeof ComparableSchema>;
export type Risk = z.infer<typeof RiskSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Human-in-the-loop review state. Every element the AI proposes can be
// accepted, amended, or rejected — and we keep the original alongside the
// consultant's decision for a full audit trail.
// ─────────────────────────────────────────────────────────────────────────────
export type Decision = "pending" | "accepted" | "amended" | "rejected";

export interface ReviewedElement {
  id: string;
  original: string;
  amended: string;
  decision: Decision;
  note: string;
}
