import { TangibleComparable } from "./tangible";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic calculation engine for the comparables table.
// The consultant controls every number; nothing here is AI-generated.
// Pipeline per comparable:
//   listed price → × FX to target currency → ÷ (1+VAT) if VAT-included
//   → × (1 + Σ adjustment %) = adjusted value.
// ─────────────────────────────────────────────────────────────────────────────

export interface CompRow {
  id: string;
  include: boolean;
  name: string;
  source: string;
  price: number;
  currency: string;
  fxRate: number; // multiplier to the target currency
  vatIncluded: boolean;
  country: string;
  dateObserved: string;
  adjTransport: number; // signed percentages
  adjCustoms: number;
  adjCondition: number;
  adjAge: number;
  adjOther: number;
}

export function rowsFromComparables(comps: TangibleComparable[]): CompRow[] {
  return comps.map((c, i) => ({
    id: `comp-${i}`,
    include: true,
    name: c.name,
    source: c.source,
    price: c.price,
    currency: c.currency,
    fxRate: 1,
    vatIncluded: c.vatIncluded,
    country: c.country,
    dateObserved: c.dateObserved,
    adjTransport: 0,
    adjCustoms: 0,
    adjCondition: 0,
    adjAge: 0,
    adjOther: 0,
  }));
}

export function netOfVat(row: CompRow, vatRatePct: number): number {
  const inTarget = row.price * (row.fxRate || 0);
  return row.vatIncluded ? inTarget / (1 + vatRatePct / 100) : inTarget;
}

export function totalAdjustmentPct(row: CompRow): number {
  return (
    row.adjTransport + row.adjCustoms + row.adjCondition + row.adjAge + row.adjOther
  );
}

export function adjustedValue(row: CompRow, vatRatePct: number): number {
  return netOfVat(row, vatRatePct) * (1 + totalAdjustmentPct(row) / 100);
}

export interface IndicatedRange {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
}

export function indicatedRange(rows: CompRow[], vatRatePct: number): IndicatedRange | null {
  const values = rows
    .filter((r) => r.include && r.price > 0)
    .map((r) => adjustedValue(r, vatRatePct))
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const mid = Math.floor(values.length / 2);
  return {
    count: values.length,
    min: values[0],
    max: values[values.length - 1],
    mean: values.reduce((s, v) => s + v, 0) / values.length,
    median:
      values.length % 2 === 1 ? values[mid] : (values[mid - 1] + values[mid]) / 2,
  };
}

export function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
