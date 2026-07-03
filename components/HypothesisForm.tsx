"use client";

import { useState } from "react";
import { ValuationInput } from "@/lib/types";
import { SECTOR_PACKS } from "@/lib/sectors";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import ImageUpload from "@/components/ImageUpload";
import { Sparkles, Eraser, FlaskConical } from "lucide-react";

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
  sectorPackId: "manufacturing",
  images: [],
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
  sectorPackId: "",
  images: [],
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
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Engagement inputs</CardTitle>
              <CardDescription>
                Provide what is known — missing items become questions for
                professional review, not invented values.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setForm(SAMPLE)}
            >
              <FlaskConical /> Load sample
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company name *</Label>
              <Input
                id="companyName"
                required
                value={form.companyName}
                onChange={(e) => set({ companyName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sector">Sector / industry *</Label>
              <Input
                id="sector"
                required
                value={form.sector}
                onChange={(e) => set({ sector: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sectorPack">Sector knowledge pack</Label>
              <Select
                id="sectorPack"
                value={form.sectorPackId}
                onChange={(e) => set({ sectorPackId: e.target.value })}
              >
                <option value="">None (generic)</option>
                {SECTOR_PACKS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => set({ country: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Reporting currency</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => set({ currency: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valuationDate">Valuation date</Label>
              <Input
                id="valuationDate"
                type="date"
                value={form.valuationDate}
                onChange={(e) => set({ valuationDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="purpose">Purpose of valuation</Label>
              <Input
                id="purpose"
                value={form.valuationPurpose}
                onChange={(e) => set({ valuationPurpose: e.target.value })}
                placeholder="e.g. M&A, financial reporting, litigation"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Business description</Label>
            <Textarea
              id="description"
              value={form.businessDescription}
              onChange={(e) => set({ businessDescription: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="financials">
              Financial summary (historical & forecast)
            </Label>
            <Textarea
              id="financials"
              value={form.financialSummary}
              onChange={(e) => set({ financialSummary: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="market">Market / industry context</Label>
            <Textarea
              id="market"
              value={form.marketContext}
              onChange={(e) => set({ marketContext: e.target.value })}
            />
          </div>

          <ImageUpload
            images={form.images}
            onChange={(images) => set({ images })}
            hint="Financial statement scans, charts, or photos of operations relevant to this valuation."
          />

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={loading}>
              <Sparkles /> {loading ? "Generating…" : "Generate hypothesis"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setForm(EMPTY)}
            >
              <Eraser /> Clear
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
