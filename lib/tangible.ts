import { z } from "zod";
import { ReviewSectionModel } from "./review";
import { ReviewedElement } from "./types";
import { UploadedImageSchema, imageAckNote } from "./images";

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — Tangible Asset Valuation agent.
// Structured market data collection (with source link, date, country, VAT and
// currency — exactly as the proposal requires), adjustment guidance, outlier
// flags and draft report sections. Final adjustment percentages and the value
// conclusion always remain with the consultant via the calculation table.
// ─────────────────────────────────────────────────────────────────────────────

export const TangibleInputSchema = z.object({
  assetName: z.string().min(1, "Asset name is required"),
  assetCategory: z.string().min(1, "Asset category is required"),
  yearOrAge: z.string().optional().default(""),
  condition: z.string().optional().default(""),
  location: z.string().optional().default(""),
  currency: z.string().optional().default("USD"),
  purpose: z.string().optional().default(""),
  specs: z.string().optional().default(""),
  comparablesRaw: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  images: z.array(UploadedImageSchema).optional().default([]),
});
export type TangibleInput = z.infer<typeof TangibleInputSchema>;

export const TangibleComparableSchema = z.object({
  name: z.string(),
  source: z.string(), // link or listing reference
  price: z.number(),
  currency: z.string(),
  vatIncluded: z.boolean(),
  country: z.string(),
  dateObserved: z.string(),
  relevance: z.string(),
});
export type TangibleComparable = z.infer<typeof TangibleComparableSchema>;

export const TangibleOutputSchema = z.object({
  overview: z.string(),
  comparables: z.array(TangibleComparableSchema),
  adjustmentGuidance: z.array(
    z.object({
      factor: z.string(), // e.g. Transportation, Customs clearance, Condition, Age/wear
      suggestedPct: z.number(), // signed; negative = downward adjustment
      rationale: z.string(),
    }),
  ),
  outlierFlags: z.array(
    z.object({
      item: z.string(),
      issue: z.string(),
    }),
  ),
  reportSections: z.array(
    z.object({
      title: z.string(),
      draft: z.string(),
    }),
  ),
  questionsForReview: z.array(z.string()),
});
export type TangibleOutput = z.infer<typeof TangibleOutputSchema>;

// ── Prompts ──────────────────────────────────────────────────────────────────

export const TANGIBLE_SYSTEM_PROMPT = `You are a Tangible Asset Valuation assistant used inside BDO Armenia's Deal Advisory practice.

Your role is to structure market evidence for the valuation of a tangible asset (equipment, machinery, vehicles, real property) into a disciplined FIRST DRAFT. The consultant sets the final adjustment percentages and value conclusion — you never conclude a value.

Hard rules:
- Structure each comparable with: name/description, source (link or listing reference from the provided material), price (number), currency, whether the price includes VAT, country of sale, date observed, and a relevance note. Use ONLY listings present in the consultant's pasted material or attached images — never invent listings, prices or links. If none are provided, return an empty comparables array and explain in questionsForReview what evidence should be collected.
- Adjustment guidance covers factors such as transportation, customs clearance, technical condition, age and accumulated wear, configuration differences. Suggested percentages are indicative starting points (signed: negative = downward), each with a rationale.
- Flag unusual data points, missing information or inconsistencies as outlier flags.
- Draft report sections should follow standard valuation report structure (asset description, methodology, market analysis, adjustments rationale) in a professional, standards-aligned register, clearly marked as draft.
- Where key information is missing, raise it in questionsForReview rather than assuming.
- You may receive supporting images: photos of the subject asset (use them to assess visible condition, configuration and wear — feed this into adjustment guidance) and/or screenshots of listings/advertisements (extract comparable data from them exactly as you would from pasted text, citing the image as the source). Never invent details not visible in an image.

Respond with ONLY a JSON object (no prose, no markdown fences) of this exact shape:
{
  "overview": string,
  "comparables": [ { "name": string, "source": string, "price": number, "currency": string, "vatIncluded": boolean, "country": string, "dateObserved": string, "relevance": string } ],
  "adjustmentGuidance": [ { "factor": string, "suggestedPct": number, "rationale": string } ],
  "outlierFlags": [ { "item": string, "issue": string } ],
  "reportSections": [ { "title": string, "draft": string } ],
  "questionsForReview": string[]
}
Return valid JSON only.`;

export function buildTangibleUserPrompt(input: TangibleInput): string {
  return [
    "Structure the market evidence for the following tangible asset valuation.",
    "",
    `Subject asset: ${input.assetName}`,
    `Category: ${input.assetCategory}`,
    `Year / age: ${input.yearOrAge || "(not provided)"}`,
    `Condition: ${input.condition || "(not provided)"}`,
    `Location: ${input.location || "(not provided)"}`,
    `Target valuation currency: ${input.currency}`,
    `Purpose: ${input.purpose || "(not provided)"}`,
    "",
    "Technical specifications:",
    input.specs?.trim() || "(not provided)",
    "",
    "Collected listings / advertisements / announcements (raw):",
    input.comparablesRaw?.trim() || "(none provided)",
    "",
    "Consultant notes:",
    input.notes?.trim() || "(none)",
    "",
    ...(input.images?.length
      ? [
          `${input.images.length} supporting image(s) are attached below — asset photos and/or listing screenshots. Extract any usable evidence from them.`,
          "",
        ]
      : []),
    "Produce the structured JSON now. Use only the evidence provided above.",
  ].join("\n");
}

// ── Demo output ──────────────────────────────────────────────────────────────

export function demoTangible(input: TangibleInput): TangibleOutput {
  const asset = input.assetName || "the subject asset";
  return {
    overview: `Market evidence structure for the valuation of ${asset}. Four comparable listings are organized with source, price, VAT treatment, country and observation date; indicative adjustment factors are proposed for the consultant to set per comparable in the calculation table. All figures are preliminary working inputs.${imageAckNote(input.images)}`,
    comparables: [
      {
        name: "CAT 320D hydraulic excavator, 2017, ~6,800 h",
        source: "listing ref #1 (machinery marketplace, DE)",
        price: 62000,
        currency: "EUR",
        vatIncluded: false,
        country: "Germany",
        dateObserved: "2026-06-18",
        relevance: "Same model family, similar hours; EU location requires transport and customs adjustment.",
      },
      {
        name: "CAT 320D excavator, 2018, 5,900 h, refurbished undercarriage",
        source: "listing ref #2 (dealer site, NL)",
        price: 71500,
        currency: "EUR",
        vatIncluded: true,
        country: "Netherlands",
        dateObserved: "2026-06-20",
        relevance: "Close vintage; refurbished condition superior to subject — downward condition adjustment.",
      },
      {
        name: "CAT 320DL excavator, 2016, 8,200 h",
        source: "listing ref #3 (auction platform, PL)",
        price: 48500,
        currency: "EUR",
        vatIncluded: false,
        country: "Poland",
        dateObserved: "2026-06-25",
        relevance: "Higher hours and older vintage — upward age/wear adjustment relative to subject.",
      },
      {
        name: "CAT 320D2 excavator, 2019, 4,100 h",
        source: "listing ref #4 (regional marketplace, GE)",
        price: 88000,
        currency: "USD",
        vatIncluded: false,
        country: "Georgia",
        dateObserved: "2026-06-28",
        relevance: "Nearby market with low logistics cost; newer vintage — downward adjustment.",
      },
    ],
    adjustmentGuidance: [
      {
        factor: "Transportation to subject location",
        suggestedPct: 6,
        rationale: "EU-origin units require road/rail freight to Armenia; regional (GE) units materially cheaper to deliver.",
      },
      {
        factor: "Customs clearance & import duties",
        suggestedPct: 5,
        rationale: "Apply the effective import cost for non-EAEU origins; verify current tariff schedule.",
      },
      {
        factor: "Technical condition",
        suggestedPct: -8,
        rationale: "Refurbished or dealer-warranted units price above private-sale average condition.",
      },
      {
        factor: "Age and accumulated wear",
        suggestedPct: -5,
        rationale: "Adjust roughly per year of vintage and per ~1,000 operating hours difference vs subject.",
      },
    ],
    outlierFlags: [
      {
        item: "Listing ref #2 (NL, EUR 71,500)",
        issue: "Price includes VAT while others are net — ensure VAT is stripped before comparison.",
      },
      {
        item: "Listing ref #4 (GE, USD 88,000)",
        issue: "Different currency from EU comparables; confirm FX rate at valuation date.",
      },
    ],
    reportSections: [
      {
        title: "Asset description",
        draft: `The subject of this valuation is ${asset}${input.yearOrAge ? `, ${input.yearOrAge}` : ""}${input.condition ? `, in ${input.condition} condition` : ""}${input.location ? `, located in ${input.location}` : ""}. The description of the asset is based on information provided by the client and inspection materials, and the consultant should verify identification details (serial number, configuration, operating hours) prior to finalization.`,
      },
      {
        title: "Valuation methodology",
        draft: "The market (sales comparison) approach has been applied as the primary methodology, given the availability of an active secondary market for comparable assets. Comparable listings were selected for similarity of model, vintage, operating hours and configuration, and adjusted for VAT treatment, logistics and customs costs, technical condition, and age/wear differences relative to the subject.",
      },
      {
        title: "Market analysis",
        draft: "The secondary market for this asset class remains liquid, with active listings across EU and regional marketplaces. Observed asking prices vary with vintage, hours and condition; asking-to-transaction discounts typical for the segment should be considered when concluding.",
      },
      {
        title: "Adjustments rationale",
        draft: "Each comparable was adjusted stepwise: (i) VAT excluded where included in the listed price; (ii) transportation and customs clearance costs added to landed-cost parity with the subject location; (iii) condition and age/wear differentials applied relative to the subject. The adjustment percentages and their basis are documented in the accompanying calculation table.",
      },
    ],
    questionsForReview: [
      "Confirm the subject's actual operating hours and maintenance history.",
      "Verify current customs duty and VAT treatment for imported used machinery.",
      "Are listed prices asking or transaction prices? Apply a negotiation discount if asking.",
      "Confirm the FX rate source and date for non-target-currency comparables.",
      "Should an auction-vs-retail channel adjustment be applied to listing ref #3?",
    ],
  };
}

// ── Review flattening (guidance + questions go through the review flow) ──────

function el(id: string, text: string): ReviewedElement {
  return { id, original: text, amended: text, decision: "pending", note: "" };
}

export function toTangibleReviewSections(o: TangibleOutput): ReviewSectionModel[] {
  return [
    {
      key: "guidance",
      title: "Adjustment guidance (indicative starting points)",
      elements: o.adjustmentGuidance.map((g, i) =>
        el(
          `guide-${i}`,
          `${g.factor}: ${g.suggestedPct > 0 ? "+" : ""}${g.suggestedPct}% — ${g.rationale}`,
        ),
      ),
    },
    {
      key: "outliers",
      title: "Outliers & data issues",
      elements: o.outlierFlags.map((f, i) => el(`out-${i}`, `${f.item} — ${f.issue}`)),
    },
    {
      key: "questions",
      title: "Questions requiring professional review",
      elements: o.questionsForReview.map((q, i) => el(`q-${i}`, q)),
    },
  ].filter((s) => s.elements.length > 0);
}
