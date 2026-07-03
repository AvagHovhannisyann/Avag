import { Hypothesis, ValuationInput } from "./types";

// A realistic sample hypothesis returned when no LLM_API_KEY is configured, so
// the full review/export flow can be demonstrated offline with dummy data.
export function demoHypothesis(input: ValuationInput): Hypothesis {
  const co = input.companyName || "the target company";
  const sector = input.sector || "the sector";
  return {
    summary: `Initial valuation logic for ${co}, operating in ${sector}. Given an established operating history and identifiable cash flows, an income approach is proposed as primary, cross-checked against market multiples. A cost/net-asset view is retained as a floor. All elements below are a starting point for professional review.`,
    approaches: [
      {
        approach: "Income",
        method: "Discounted Cash Flow (DCF)",
        rationale:
          "The business appears to generate identifiable, forecastable cash flows, making a DCF the most defensible primary method.",
        priority: "Primary",
      },
      {
        approach: "Market",
        method: "Guideline Public Company & precedent transaction multiples (EV/EBITDA, EV/Revenue)",
        rationale:
          "Provides a market-based cross-check on the DCF and anchors assumptions to observable pricing in comparable businesses.",
        priority: "Cross-check",
      },
      {
        approach: "Cost",
        method: "Adjusted Net Asset Value",
        rationale:
          "Serves as a value floor and a sanity check, particularly relevant if the business is asset-heavy.",
        priority: "Secondary",
      },
    ],
    valueDrivers: [
      "Revenue growth rate and its sustainability",
      "EBITDA margin and operating leverage",
      "Customer concentration and contract durability",
      "Capital intensity (CAPEX and working-capital needs)",
      "Competitive position and barriers to entry in " + sector,
    ],
    assumptions: [
      {
        name: "Forecast horizon",
        basis: "Standard explicit forecast period",
        rationale: "A 5-year explicit horizon before terminal value is a reasonable default, subject to the business cycle.",
      },
      {
        name: "Terminal growth rate",
        basis: "Long-run GDP / sector growth",
        rationale: "Terminal growth should not exceed long-run macro growth for the relevant geography.",
      },
      {
        name: "Discount rate (WACC)",
        basis: "Build-up from risk-free rate, equity risk premium, sector beta, and company-specific risk",
        rationale: "Must reflect country and company-specific risk; see WACC considerations.",
      },
    ],
    comparables: [
      { name: "Listed peers in " + sector, type: "Company", relevance: "Trading multiples for a market cross-check." },
      { name: "Recent M&A transactions in " + sector, type: "Transaction", relevance: "Precedent pricing including control premia." },
      { name: "EV/EBITDA sector benchmark", type: "Multiple", relevance: "Headline sanity check on implied value." },
    ],
    riskAreas: [
      { area: "Forecast reliability", description: "Management forecasts may be optimistic and require normalization/challenge.", severity: "High" },
      { area: "Customer concentration", description: "Dependence on a few customers can materially affect risk and discount rate.", severity: "Medium" },
      { area: "Data quality", description: "Historical financials may need normalization for one-off items.", severity: "Medium" },
    ],
    waccConsiderations: [
      "Risk-free rate appropriate to " + (input.currency || "the reporting currency") + " and country",
      "Country risk premium for " + (input.country || "the relevant jurisdiction"),
      "Sector/unlevered beta re-levered to the target's capital structure",
      "Size premium and any company-specific risk premium",
    ],
    questionsForReview: [
      "Are audited historical financials available, and do they require normalization for one-off items?",
      "What is the basis and reliability of management's forecast?",
      "Is the intended basis of value market value, fair value, or investment value?",
      "Are there off-balance-sheet items, contingent liabilities, or related-party arrangements?",
      "What is the appropriate peer set given the company's size and geography?",
    ],
  };
}
