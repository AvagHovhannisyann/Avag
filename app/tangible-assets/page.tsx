"use client";

import { useEffect, useState } from "react";
import {
  TangibleInput,
  TangibleOutput,
  toTangibleReviewSections,
} from "@/lib/tangible";
import {
  CompRow,
  rowsFromComparables,
  adjustedValue,
  netOfVat,
  totalAdjustmentPct,
  indicatedRange,
  fmt,
} from "@/lib/tangibleCalc";
import { ReviewSectionModel, toExportSections } from "@/lib/review";
import { ReviewedElement } from "@/lib/types";
import ReviewBoard, { ReviewStats, useReviewStats } from "@/components/ReviewBoard";
import ComparablesTable from "@/components/ComparablesTable";
import ImageUpload from "@/components/ImageUpload";
import SaveButton from "@/components/SaveButton";
import { getItem } from "@/lib/saved";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { downloadBlob } from "@/lib/download";
import {
  CheckCheck,
  Eraser,
  FileDown,
  FileSpreadsheet,
  FlaskConical,
  Info,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

const EMPTY: TangibleInput = {
  assetName: "",
  assetCategory: "",
  yearOrAge: "",
  condition: "",
  location: "",
  currency: "USD",
  purpose: "",
  specs: "",
  comparablesRaw: "",
  notes: "",
  images: [],
};

const SAMPLE: TangibleInput = {
  assetName: "CAT 320D hydraulic excavator",
  assetCategory: "Construction machinery",
  yearOrAge: "2018, ~7,200 operating hours",
  condition: "Good working condition, standard bucket, no warranty",
  location: "Yerevan, Armenia",
  currency: "USD",
  purpose: "Collateral valuation for bank financing",
  specs: "Operating weight ~20t, C6.4 engine, standard undercarriage, A/C cabin.",
  comparablesRaw:
    "1) CAT 320D 2017, 6,800h — EUR 62,000 net (machinery marketplace, Germany, seen 18.06.2026)\n" +
    "2) CAT 320D 2018, 5,900h refurbished undercarriage — EUR 71,500 incl. VAT (dealer, Netherlands, 20.06.2026)\n" +
    "3) CAT 320DL 2016, 8,200h — EUR 48,500 net (auction platform, Poland, 25.06.2026)\n" +
    "4) CAT 320D2 2019, 4,100h — USD 88,000 net (regional marketplace, Georgia, 28.06.2026)",
  notes: "Bank requires market value with a liquidation cross-check.",
  images: [],
};

export default function TangibleAssetsPage() {
  const [form, setForm] = useState<TangibleInput>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"model" | "demo" | null>(null);
  const [modelName, setModelName] = useState("");
  const [output, setOutput] = useState<TangibleOutput | null>(null);
  const [sections, setSections] = useState<ReviewSectionModel[]>([]);
  const [rows, setRows] = useState<CompRow[]>([]);
  const [vatRate, setVatRate] = useState(20);
  const [reportSections, setReportSections] = useState<{ title: string; draft: string }[]>([]);
  const [exporting, setExporting] = useState<"word" | "excel" | null>(null);

  const stats = useReviewStats(sections);
  const set = (patch: Partial<TangibleInput>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    getItem(id).then((item) => {
      if (!item || item.module !== "tangible-assets") return;
      const p = item.payload;
      if (p.form) setForm(p.form);
      if (p.output) setOutput(p.output);
      if (p.sections) setSections(p.sections);
      if (p.rows) setRows(p.rows);
      if (typeof p.vatRate === "number") setVatRate(p.vatRate);
      if (p.reportSections) setReportSections(p.reportSections);
    });
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSource(null);
    try {
      const res = await fetch("/api/tangible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      const out = data.output as TangibleOutput;
      setOutput(out);
      setSections(toTangibleReviewSections(out));
      setRows(rowsFromComparables(out.comparables));
      setReportSections(out.reportSections.map((s) => ({ ...s })));
      setSource(data.source);
      setModelName(data.model);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function updateElement(sectionKey: string, next: ReviewedElement) {
    setSections((prev) =>
      prev.map((s) =>
        s.key !== sectionKey
          ? s
          : { ...s, elements: s.elements.map((el) => (el.id === next.id ? next : el)) },
      ),
    );
  }

  function bulkAccept() {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        elements: s.elements.map((el) =>
          el.decision === "pending" ? { ...el, decision: "accepted" as const } : el,
        ),
      })),
    );
  }

  const range = indicatedRange(rows, vatRate);

  async function exportWord() {
    setExporting("word");
    setError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docTitle: "Tangible Asset Valuation — Working Paper",
          companyName: form.assetName,
          meta: `Reviewed ${stats.accepted + stats.amended} of ${stats.total} proposed elements · ${new Date().toLocaleString()}`,
          sections: [
            { title: "Overview", items: output?.overview ? [output.overview] : [] },
            ...reportSections.map((s) => ({ title: `Report draft — ${s.title}`, items: [s.draft] })),
            ...toExportSections(sections),
            {
              title: "Indicated range (arithmetic aid — not a conclusion)",
              items: range
                ? [
                    `Based on ${range.count} included comparables (VAT rate ${vatRate}%): min ${fmt(range.min)}, median ${fmt(range.median)}, mean ${fmt(range.mean)}, max ${fmt(range.max)} ${form.currency}.`,
                  ]
                : [],
            },
          ],
          images: form.images,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Export failed.");
      downloadBlob(await res.blob(), `${form.assetName || "asset"}-valuation.docx`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(null);
    }
  }

  async function exportExcel() {
    setExporting("excel");
    setError(null);
    try {
      const res = await fetch("/api/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `${form.assetName || "asset"}-comparables`,
          sheets: [
            {
              name: "Comparables",
              columns: [
                { header: "Included", width: 10 },
                { header: "Comparable", width: 42 },
                { header: "Source", width: 34 },
                { header: "Listed price", width: 14 },
                { header: "Currency", width: 10 },
                { header: `FX to ${form.currency}`, width: 12 },
                { header: "VAT included", width: 12 },
                { header: "Country", width: 14 },
                { header: "Date observed", width: 14 },
                { header: "Transport %", width: 11 },
                { header: "Customs %", width: 11 },
                { header: "Condition %", width: 11 },
                { header: "Age/wear %", width: 11 },
                { header: "Other %", width: 10 },
                { header: `Net of VAT (${form.currency})`, width: 16 },
                { header: "Total adj %", width: 11 },
                { header: `Adjusted value (${form.currency})`, width: 18 },
              ],
              rows: rows.map((r) => [
                r.include ? "Yes" : "No",
                r.name,
                r.source,
                r.price,
                r.currency,
                r.fxRate,
                r.vatIncluded ? "Yes" : "No",
                r.country,
                r.dateObserved,
                r.adjTransport,
                r.adjCustoms,
                r.adjCondition,
                r.adjAge,
                r.adjOther,
                r.include && r.price > 0 ? Math.round(netOfVat(r, vatRate)) : null,
                totalAdjustmentPct(r),
                r.include && r.price > 0 ? Math.round(adjustedValue(r, vatRate)) : null,
              ]),
            },
            {
              name: "Summary",
              columns: [
                { header: "Metric", width: 26 },
                { header: `Value (${form.currency})`, width: 20 },
              ],
              rows: range
                ? [
                    ["Included comparables", range.count],
                    ["VAT rate applied (%)", vatRate],
                    ["Minimum", Math.round(range.min)],
                    ["Median", Math.round(range.median)],
                    ["Mean", Math.round(range.mean)],
                    ["Maximum", Math.round(range.max)],
                  ]
                : [["Included comparables", 0]],
            },
          ],
          images: form.images,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Export failed.");
      downloadBlob(await res.blob(), `${form.assetName || "asset"}-comparables.xlsx`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Tangible Asset Valuation</h1>
        <p className="text-sm text-muted-foreground">
          Phase 3 · structured comparables with source, VAT, country and date;
          consultant-controlled adjustments; indicated range and draft report
          sections.
        </p>
      </div>

      <Card>
        <form onSubmit={handleGenerate}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subject asset & market evidence</CardTitle>
                <CardDescription>
                  Paste collected listings below — the agent structures them; it
                  never invents evidence.
                </CardDescription>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setForm(SAMPLE)}>
                <FlaskConical /> Load sample
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ta-name">Asset name *</Label>
                <Input
                  id="ta-name"
                  required
                  value={form.assetName}
                  onChange={(e) => set({ assetName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ta-cat">Asset category *</Label>
                <Input
                  id="ta-cat"
                  required
                  value={form.assetCategory}
                  onChange={(e) => set({ assetCategory: e.target.value })}
                  placeholder="e.g. Construction machinery, vehicles, real property"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ta-year">Year / age & hours</Label>
                <Input
                  id="ta-year"
                  value={form.yearOrAge}
                  onChange={(e) => set({ yearOrAge: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ta-cond">Condition</Label>
                <Input
                  id="ta-cond"
                  value={form.condition}
                  onChange={(e) => set({ condition: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ta-loc">Location</Label>
                <Input
                  id="ta-loc"
                  value={form.location}
                  onChange={(e) => set({ location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ta-ccy">Target currency</Label>
                  <Input
                    id="ta-ccy"
                    value={form.currency}
                    onChange={(e) => set({ currency: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ta-purpose">Purpose</Label>
                  <Input
                    id="ta-purpose"
                    value={form.purpose}
                    onChange={(e) => set({ purpose: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ta-specs">Technical specifications</Label>
              <Textarea
                id="ta-specs"
                value={form.specs}
                onChange={(e) => set({ specs: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ta-comps">
                Collected listings / advertisements (one per line, with price,
                currency, VAT treatment, country, date, link/ref)
              </Label>
              <Textarea
                id="ta-comps"
                className="min-h-[120px]"
                value={form.comparablesRaw}
                onChange={(e) => set({ comparablesRaw: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ta-notes">Consultant notes</Label>
              <Textarea
                id="ta-notes"
                value={form.notes}
                onChange={(e) => set({ notes: e.target.value })}
              />
            </div>

            <ImageUpload
              images={form.images}
              onChange={(images) => set({ images })}
              hint="Photos of the asset's condition, or screenshots of listings/advertisements — extracted the same way as pasted text."
            />

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={loading}>
                <Sparkles /> {loading ? "Structuring…" : "Structure market evidence"}
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

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {source === "demo" && (
        <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle>Demo mode</AlertTitle>
          <AlertDescription>
            No model API key configured — sample structured evidence is shown.
            Set <code>LLM_API_KEY</code>, <code>LLM_BASE_URL</code> and{" "}
            <code>LLM_MODEL</code> to use a real model.
          </AlertDescription>
        </Alert>
      )}

      {output && (
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Structured evidence — {form.assetName}</CardTitle>
                  {source === "model" && (
                    <CardDescription>Generated by model: {modelName}</CardDescription>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={bulkAccept} type="button">
                    <CheckCheck /> Accept all pending
                  </Button>
                  <SaveButton
                    module="tangible-assets"
                    title={form.assetName}
                    getPayload={() => ({ form, output, sections, rows, vatRate, reportSections })}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportExcel}
                    type="button"
                    disabled={exporting !== null}
                  >
                    <FileSpreadsheet />
                    {exporting === "excel" ? "Exporting…" : "Export to Excel"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={exportWord}
                    type="button"
                    disabled={exporting !== null}
                  >
                    <FileDown /> {exporting === "word" ? "Exporting…" : "Export to Word"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">{output.overview}</p>
              <ReviewStats stats={stats} />
            </CardContent>
          </Card>

          <ComparablesTable
            rows={rows}
            onRowsChange={setRows}
            vatRate={vatRate}
            onVatRateChange={setVatRate}
            targetCurrency={form.currency}
          />

          <ReviewBoard sections={sections} onUpdate={updateElement} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Draft report sections (edit directly)
              </CardTitle>
              <CardDescription>
                Carried into the Word export as drafted; align with approved
                templates before issuance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportSections.map((s, i) => (
                <div key={s.title} className="space-y-1.5">
                  <Label>{s.title}</Label>
                  <Textarea
                    className="min-h-[110px]"
                    value={s.draft}
                    onChange={(e) =>
                      setReportSections((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, draft: e.target.value } : x)),
                      )
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
