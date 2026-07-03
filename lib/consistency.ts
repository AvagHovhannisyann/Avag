import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — Cross-document consistency checker.
// The proposal asks for support "to ensure consistency between the Excel
// financial model, Word report, and PowerPoint presentation". The consultant
// pastes extracts from two (or three) documents; the agent flags mismatched
// figures, dates, assumptions and terminology.
// ─────────────────────────────────────────────────────────────────────────────

export const ConsistencyInputSchema = z.object({
  modelExtract: z.string().min(1, "Model extract is required"),
  reportExtract: z.string().min(1, "Report extract is required"),
  presentationExtract: z.string().optional().default(""),
  context: z.string().optional().default(""),
});
export type ConsistencyInput = z.infer<typeof ConsistencyInputSchema>;

export const ConsistencyOutputSchema = z.object({
  summary: z.string(),
  findings: z.array(
    z.object({
      severity: z.enum(["high", "medium", "low"]),
      finding: z.string(),
      locations: z.string(), // where the mismatch appears
      suggestion: z.string(),
    }),
  ),
});
export type ConsistencyOutput = z.infer<typeof ConsistencyOutputSchema>;

export const CONSISTENCY_SYSTEM_PROMPT = `You are a cross-document consistency checker used inside BDO Armenia's Deal Advisory practice.

You compare extracts from a financial model (Excel), a report (Word) and optionally a presentation (PowerPoint) for the SAME engagement, and flag inconsistencies:
- numeric mismatches (values, growth rates, margins, dates, currency units, scale — million vs billion);
- assumption mismatches (different discount rates, horizons, scenario names);
- terminology drift (different names for the same item);
- statements in the narrative not supported by the model figures.

Rules:
- Compare only what is present; do not invent figures.
- Every finding must cite where each side of the mismatch appears (locations).
- Severity: "high" = contradictory numbers/conclusions; "medium" = ambiguous or unit/scale risks; "low" = terminology/formatting drift.
- If the extracts are consistent, return an empty findings array and say so in the summary.

Respond with ONLY a JSON object (no prose, no markdown fences) of this exact shape:
{
  "summary": string,
  "findings": [ { "severity": "high"|"medium"|"low", "finding": string, "locations": string, "suggestion": string } ]
}
Return valid JSON only.`;

export function buildConsistencyUserPrompt(input: ConsistencyInput): string {
  return [
    "Check the following extracts for cross-document consistency.",
    "",
    input.context ? `Engagement context: ${input.context}\n` : "",
    "=== EXCEL MODEL EXTRACT ===",
    input.modelExtract.trim(),
    "",
    "=== WORD REPORT EXTRACT ===",
    input.reportExtract.trim(),
    "",
    ...(input.presentationExtract?.trim()
      ? ["=== POWERPOINT EXTRACT ===", input.presentationExtract.trim(), ""]
      : []),
    "Produce the structured JSON findings now.",
  ].join("\n");
}

export function demoConsistency(_input: ConsistencyInput): ConsistencyOutput {
  return {
    summary:
      "Demo check across the provided extracts: three indicative inconsistencies flagged — one numeric contradiction, one unit/scale risk and one terminology drift. Configure a model API key to run a real comparison of your own extracts.",
    findings: [
      {
        severity: "high",
        finding:
          "Revenue growth assumption differs: the model extract implies 12% annual growth, while the report narrative states 15%.",
        locations: "Model: revenue build-up section · Report: 'Financial projections' paragraph",
        suggestion:
          "Align the narrative to the model (or vice versa) and re-generate dependent figures before issuance.",
      },
      {
        severity: "medium",
        finding:
          "Scale ambiguity: the model shows figures in AMD thousands while the report table caption says AMD millions.",
        locations: "Model: header row · Report: Table 4 caption",
        suggestion: "State units once per exhibit and verify all derived tables use the same scale.",
      },
      {
        severity: "low",
        finding:
          "Terminology drift: the same case is called 'Base case' in the model and 'Management case' in the presentation.",
        locations: "Model: scenario tab · Presentation: slide 7",
        suggestion: "Adopt a single scenario naming convention across all three documents.",
      },
    ],
  };
}
