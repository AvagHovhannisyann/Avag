import { Hypothesis, ReviewedElement } from "./types";

export interface ReviewSectionModel {
  key: string;
  title: string;
  elements: ReviewedElement[];
}

function el(id: string, text: string): ReviewedElement {
  return { id, original: text, amended: text, decision: "pending", note: "" };
}

// Flattens a structured hypothesis into review sections whose every element can
// be independently accepted / amended / rejected by the consultant.
export function toReviewSections(h: Hypothesis): ReviewSectionModel[] {
  return [
    {
      key: "approaches",
      title: "Proposed valuation approaches",
      elements: h.approaches.map((a, i) =>
        el(`approach-${i}`, `[${a.priority}] ${a.approach} — ${a.method}: ${a.rationale}`),
      ),
    },
    {
      key: "valueDrivers",
      title: "Key value drivers",
      elements: h.valueDrivers.map((d, i) => el(`driver-${i}`, d)),
    },
    {
      key: "assumptions",
      title: "Key assumptions",
      elements: h.assumptions.map((a, i) =>
        el(`assumption-${i}`, `${a.name} — basis: ${a.basis}. ${a.rationale}`),
      ),
    },
    {
      key: "comparables",
      title: "Comparable benchmarks",
      elements: h.comparables.map((c, i) =>
        el(`comp-${i}`, `[${c.type}] ${c.name} — ${c.relevance}`),
      ),
    },
    {
      key: "riskAreas",
      title: "Possible risk areas",
      elements: h.riskAreas.map((r, i) =>
        el(`risk-${i}`, `[${r.severity}] ${r.area} — ${r.description}`),
      ),
    },
    {
      key: "wacc",
      title: "WACC / discount-rate considerations",
      elements: h.waccConsiderations.map((w, i) => el(`wacc-${i}`, w)),
    },
    {
      key: "questions",
      title: "Questions requiring professional review",
      elements: h.questionsForReview.map((q, i) => el(`q-${i}`, q)),
    },
  ];
}

// Builds the export payload from the current review state: only accepted or
// amended elements are carried forward (rejected ones are dropped), using the
// consultant's amended text where provided.
export function toExportSections(sections: ReviewSectionModel[]) {
  return sections.map((s) => ({
    title: s.title,
    items: s.elements
      .filter((e) => e.decision === "accepted" || e.decision === "amended")
      .map((e) => {
        const text = e.decision === "amended" ? e.amended : e.original;
        return e.note ? `${text}  (reviewer note: ${e.note})` : text;
      }),
  }));
}
