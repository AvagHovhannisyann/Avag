// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — Sectoral knowledge layers.
// Priority industries named in the proposal: renewable energy, agriculture,
// healthcare, retail, manufacturing, real estate. Each pack accumulates
// sector-specific value drivers, risks, benchmarks and valuation logic, and is
// injected into agent prompts when selected.
// ─────────────────────────────────────────────────────────────────────────────

export interface SectorPack {
  id: string;
  name: string;
  valuationNotes: string;
  valueDrivers: string[];
  risks: string[];
  benchmarks: string[];
  typicalMultiples: string[];
}

export const SECTOR_PACKS: SectorPack[] = [
  {
    id: "renewable-energy",
    name: "Renewable Energy",
    valuationNotes:
      "Project-finance style DCF over asset life is standard; contracted (PPA/feed-in tariff) vs merchant cash flows should be valued separately. Cost approach is relevant for early-stage/pre-COD assets.",
    valueDrivers: [
      "Contracted tariff level and remaining PPA/feed-in term",
      "Resource yield (irradiation/wind capacity factor, P50 vs P90)",
      "Grid connection rights and curtailment risk",
      "O&M cost per MW and availability guarantees",
      "Remaining useful life and repowering optionality",
    ],
    risks: [
      "Regulatory / tariff regime changes",
      "Counterparty (offtaker) credit risk",
      "Curtailment and grid stability",
      "Resource variability vs forecast",
    ],
    benchmarks: [
      "EV per MW installed capacity",
      "Levelized cost of energy (LCOE) vs regional peers",
      "Capacity factor vs P50 estimate",
    ],
    typicalMultiples: ["EV/MW", "EV/EBITDA (contracted)", "P/CAFD"],
  },
  {
    id: "agriculture",
    name: "Agriculture",
    valuationNotes:
      "Blend income and cost approaches: land and biological assets often carry significant value independent of operations. Normalize for weather-driven yield volatility using multi-year averages.",
    valueDrivers: [
      "Land ownership vs lease structure and irrigation access",
      "Yield per hectare vs regional benchmarks",
      "Crop mix, price exposure and offtake contracts",
      "Subsidy and grant dependence",
      "Post-harvest storage and processing integration",
    ],
    risks: [
      "Weather and climate volatility",
      "Commodity price cycles",
      "Water rights and irrigation reliability",
      "Subsidy regime changes",
    ],
    benchmarks: [
      "Value per hectare (by crop/irrigation status)",
      "Yield per hectare vs national average",
      "EBITDA margin normalized over a full crop cycle",
    ],
    typicalMultiples: ["EV/EBITDA (cycle-normalized)", "Value/hectare", "EV/Revenue"],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    valuationNotes:
      "Reimbursement mix (state vs private out-of-pocket) drives revenue quality. Licenses, key clinician retention and accreditation are critical intangibles to assess alongside the DCF.",
    valueDrivers: [
      "Payor mix and reimbursement tariff trends",
      "Utilization/occupancy of key equipment and beds",
      "Physician retention and referral networks",
      "Service line mix (diagnostics vs surgical vs outpatient)",
      "Regulatory licenses and accreditation status",
    ],
    risks: [
      "Tariff/reimbursement changes",
      "Key-person dependence on lead clinicians",
      "Malpractice and compliance liabilities",
      "CAPEX cycle for medical equipment renewal",
    ],
    benchmarks: [
      "Revenue per bed / per visit",
      "EBITDA margin by service line",
      "Equipment utilization rates",
    ],
    typicalMultiples: ["EV/EBITDA", "EV/Revenue", "Value per bed"],
  },
  {
    id: "retail",
    name: "Retail",
    valuationNotes:
      "Like-for-like sales growth separates organic performance from footprint expansion. Lease obligations should be treated consistently (IFRS 16) across comparables.",
    valueDrivers: [
      "Like-for-like sales growth and basket size",
      "Store footprint economics (sales per sqm, payback per new store)",
      "Gross margin and supplier terms",
      "Private label share and inventory turns",
      "E-commerce channel share and fulfilment cost",
    ],
    risks: [
      "Consumer purchasing power cycles",
      "Lease renewal terms and anchor locations",
      "Import/FX exposure in COGS",
      "Competition from discounters and marketplaces",
    ],
    benchmarks: [
      "Sales per square meter",
      "Inventory turnover",
      "EBITDA margin vs format peers",
    ],
    typicalMultiples: ["EV/EBITDA", "EV/Revenue", "EV/Sales per sqm"],
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    valuationNotes:
      "Assess capacity utilization and maintenance vs growth CAPEX split carefully; the cost approach (replacement cost of the asset base) is a meaningful cross-check for asset-heavy plants.",
    valueDrivers: [
      "Capacity utilization and order backlog",
      "Input cost pass-through ability",
      "Customer concentration and contract length",
      "Automation level and unit labor cost",
      "Export share and market diversification",
    ],
    risks: [
      "Raw material price volatility",
      "Technological obsolescence of equipment",
      "Single-facility concentration risk",
      "Working capital intensity",
    ],
    benchmarks: [
      "EBITDA per unit of capacity",
      "Capacity utilization vs sector norm",
      "Maintenance CAPEX as % of depreciation",
    ],
    typicalMultiples: ["EV/EBITDA", "EV/Capacity unit", "P/B (asset-heavy)"],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    valuationNotes:
      "Income capitalization / discounted net operating income is primary for yielding assets; direct sales comparison for land and residential. Reconcile NOI-based value with comparable price per sqm.",
    valueDrivers: [
      "Location, tenant quality and WAULT (lease length)",
      "Occupancy and effective rent per sqm",
      "NOI margin and irrecoverable costs",
      "Development pipeline and permitting status",
      "Capitalization rate environment",
    ],
    risks: [
      "Interest rate / cap rate expansion",
      "Tenant concentration and vacancy",
      "Construction cost inflation (developments)",
      "Title, permitting and zoning issues",
    ],
    benchmarks: [
      "Price per sqm vs comparable transactions",
      "Market cap rates by asset class",
      "Occupancy vs submarket average",
    ],
    typicalMultiples: ["Cap rate (NOI yield)", "Price/sqm", "EV/NOI"],
  },
];

export function sectorPackById(id: string): SectorPack | undefined {
  return SECTOR_PACKS.find((s) => s.id === id);
}

// Compact text block injected into LLM prompts when a sector pack is selected.
export function sectorPackPromptBlock(pack: SectorPack): string {
  return [
    `Sector knowledge pack — ${pack.name}:`,
    `Valuation notes: ${pack.valuationNotes}`,
    `Typical value drivers: ${pack.valueDrivers.join("; ")}`,
    `Typical risks: ${pack.risks.join("; ")}`,
    `Common benchmarks: ${pack.benchmarks.join("; ")}`,
    `Common multiples: ${pack.typicalMultiples.join("; ")}`,
  ].join("\n");
}
