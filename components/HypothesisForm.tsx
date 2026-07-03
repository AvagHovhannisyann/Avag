"use client";

import { useState } from "react";
import { ValuationInput } from "@/lib/types";

const SAMPLE: ValuationInput = {
  companyName: "Ararat Foods LLC",
  sector: "Packaged food & beverage manufacturing",
  country: "Armenia",
  currency: "AMD",
  valuationDate: "2026-06-30",
  valuationPurpose: "Acquisition (buy-side) — indicative offer",
  businessDescription:
    "Mid-sized producer of packaged dairy and juice products with regional distribution across the South Caucasus. ~250 employees, single production facility, growing export share.",
  financialSummary:
    "Revenue (last 3y): 6.1bn / 7.0bn / 8.2bn AMD. EBITDA margin ~14-16%. Modest net debt. CAPEX cycle for a new line completed last year.",
  marketContext:
    "Regional dairy demand growing mid-single digits; input (raw milk) price volatility; increasing competition from imports; export opportunities to neighbouring markets.",
};

const EMPTY: ValuationInput = {
  companyName: "",
  sector: "",
  country: "",
  currency: "USD",
  valuationDate: "",
  valuationPurpose: "",
  businessDescription: "",
  financialSummary: "",
  marketContext: "",
};

export default function HypothesisForm({
  onSubmit,
  loading,
}: {
  onSubmit: (input: ValuationInput) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<ValuationInput>(EMPTY);
  const set = (patch: Partial<ValuationInput>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Engagement inputs</h2>
        <button
          type="button"
          className="text-xs font-medium text-bdo-blue hover:underline"
          onClick={() => setForm(SAMPLE)}
        >
          Load sample (dummy data)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Company name *</label>
          <input
            className="input"
            required
            value={form.companyName}
            onChange={(e) => set({ companyName: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Sector / industry *</label>
          <input
            className="input"
            required
            value={form.sector}
            onChange={(e) => set({ sector: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Country</label>
          <input
            className="input"
            value={form.country}
            onChange={(e) => set({ country: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Reporting currency</label>
          <input
            className="input"
            value={form.currency}
            onChange={(e) => set({ currency: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Valuation date</label>
          <input
            className="input"
            type="date"
            value={form.valuationDate}
            onChange={(e) => set({ valuationDate: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Purpose of valuation</label>
          <input
            className="input"
            value={form.valuationPurpose}
            onChange={(e) => set({ valuationPurpose: e.target.value })}
            placeholder="e.g. M&A, financial reporting, litigation"
          />
        </div>
      </div>

      <div>
        <label className="label">Business description</label>
        <textarea
          className="textarea"
          value={form.businessDescription}
          onChange={(e) => set({ businessDescription: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Financial summary (historical & forecast)</label>
        <textarea
          className="textarea"
          value={form.financialSummary}
          onChange={(e) => set({ financialSummary: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Market / industry context</label>
        <textarea
          className="textarea"
          value={form.marketContext}
          onChange={(e) => set({ marketContext: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Generating…" : "Generate hypothesis"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={loading}
          onClick={() => setForm(EMPTY)}
        >
          Clear
        </button>
      </div>
    </form>
  );
}
