"use client";

import { useState } from "react";
import { FinModelInput, FinModelOutput, toFinReviewSections } from "@/lib/finmodel";
import { ReviewSectionModel, toExportSections } from "@/lib/review";
import { ReviewedElement } from "@/lib/types";
import { SECTOR_PACKS } from "@/lib/sectors";
import ReviewBoard, { ReviewStats, useReviewStats } from "@/components/ReviewBoard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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

const EMPTY: FinModelInput = {
  mode: "existing",
  companyName: "",
  sector: "",
  currency: "USD",
  horizonYears: 5,
  financialData: "",
  businessContext: "",
  assumptionNotes: "",
  sectorPackId: "",
};

const SAMPLE_EXISTING: FinModelInput = {
  mode: "existing",
  companyName: "Ararat Foods LLC",
  sector: "Packaged food & beverage manufacturing",
  currency: "AMD",
  horizonYears: 5,
  financialData:
    "Revenue: 6.1bn / 7.0bn / 8.2bn AMD (FY23-FY25). EBITDA: 0.9bn / 1.1bn / 1.2bn. One-off gain on equipment sale 0.15bn in FY25. Rent paid to related party at ~60% of market. Net debt 1.4bn AMD.",
  businessContext:
    "Dairy and juice producer; single plant; new filling line commissioned FY25; export share 18% and growing.",
  assumptionNotes: "Management forecasts 12% revenue growth; challenge against capacity.",
  sectorPackId: "manufacturing",
};

const SAMPLE_NEW: FinModelInput = {
  mode: "newproject",
  companyName: "Sevan Solar 20MW",
  sector: "Utility-scale solar PV",
  currency: "USD",
  horizonYears: 12,
  financialData:
    "EPC quote: ~0.62 USD/W. Expected P50 yield: 1,650 kWh/kWp. Indicative PPA: 4.9 USc/kWh for 20 years. O&M quote: 8,500 USD/MW/yr.",
  businessContext:
    "Greenfield solar plant near Lake Sevan; grid connection agreement in progress; sponsors seek 70/30 debt/equity structure.",
  assumptionNotes: "Check degradation (0.4-0.5%/yr) and curtailment risk.",
  sectorPackId: "renewable-energy",
};

export default function FinancialModelPage() {
  const [form, setForm] = useState<FinModelInput>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"model" | "demo" | null>(null);
  const [modelName, setModelName] = useState("");
  const [output, setOutput] = useState<FinModelOutput | null>(null);
  const [sections, setSections] = useState<ReviewSectionModel[]>([]);
  const [narrative, setNarrative] = useState("");
  const [exporting, setExporting] = useState<"word" | "excel" | null>(null);

  const stats = useReviewStats(sections);
  const set = (patch: Partial<FinModelInput>) => setForm((f) => ({ ...f, ...patch }));

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSource(null);
    try {
      const res = await fetch("/api/financial-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      const out = data.output as FinModelOutput;
      setOutput(out);
      setSections(toFinReviewSections(out));
      setNarrative(out.narrativeDraft);
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

  async function exportWord() {
    setExporting("word");
    setError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docTitle:
            form.mode === "existing"
              ? "Financial Model Assumptions — Working Paper"
              : "Business Plan Financial Section — Working Paper",
          companyName: form.companyName,
          meta: `Reviewed ${stats.accepted + stats.amended} of ${stats.total} proposed elements · ${new Date().toLocaleString()}`,
          sections: [
            { title: "Overview", items: output?.overview ? [output.overview] : [] },
            ...toExportSections(sections),
            { title: "Financial plan narrative (draft)", items: narrative ? [narrative] : [] },
          ],
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Export failed.");
      downloadBlob(await res.blob(), `${form.companyName || "model"}-assumptions.docx`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(null);
    }
  }

  async function exportExcel() {
    if (!output) return;
    setExporting("excel");
    setError(null);
    try {
      const kept = (key: string) =>
        sections
          .find((s) => s.key === key)
          ?.elements.filter((e) => e.decision !== "rejected") ?? [];

      const bookRows: (string | number | null)[][] = [];
      for (const s of sections) {
        if (!s.key.startsWith("book-")) continue;
        for (const e of s.elements) {
          if (e.decision === "rejected") continue;
          bookRows.push([
            s.title.replace("Assumption book — ", ""),
            e.decision === "amended" ? e.amended : e.original,
            e.decision,
            e.note || "",
          ]);
        }
      }

      const res = await fetch("/api/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `${form.companyName || "model"}-assumption-book`,
          modelSkeleton: { currency: form.currency, years: form.horizonYears },
          sheets: [
            {
              name: "Assumption book",
              columns: [
                { header: "Category", width: 18 },
                { header: "Assumption (as reviewed)", width: 70 },
                { header: "Decision", width: 12 },
                { header: "Reviewer note", width: 40 },
              ],
              rows: bookRows,
            },
            {
              name: "Normalization",
              columns: [
                { header: "Adjustment (as reviewed)", width: 80 },
                { header: "Decision", width: 12 },
                { header: "Reviewer note", width: 40 },
              ],
              rows: kept("normalization").map((e) => [
                e.decision === "amended" ? e.amended : e.original,
                e.decision,
                e.note || "",
              ]),
            },
            {
              name: "Scenarios & sensitivities",
              columns: [
                { header: "Item (as reviewed)", width: 80 },
                { header: "Type", width: 16 },
              ],
              rows: [
                ...kept("scenarios").map((e) => [
                  e.decision === "amended" ? e.amended : e.original,
                  "Scenario",
                ]),
                ...kept("sensitivities").map((e) => [
                  e.decision === "amended" ? e.amended : e.original,
                  "Sensitivity",
                ]),
              ],
            },
          ],
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Export failed.");
      downloadBlob(await res.blob(), `${form.companyName || "model"}-assumption-book.xlsx`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Financial Model & Business Plan</h1>
        <p className="text-sm text-muted-foreground">
          Phase 2 · normalization, assumption book, consistency checks,
          scenarios and the financial plan narrative — as a reviewable first
          draft.
        </p>
      </div>

      <Card>
        <form onSubmit={handleGenerate}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Engagement inputs</CardTitle>
                <CardDescription>
                  Choose the track: valuation of an existing business, or a new
                  project / business plan.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setForm(form.mode === "existing" ? SAMPLE_EXISTING : SAMPLE_NEW)
                }
              >
                <FlaskConical /> Load sample
              </Button>
            </div>
            <Tabs
              value={form.mode}
              onValueChange={(v) => set({ mode: v as FinModelInput["mode"] })}
              className="pt-2"
            >
              <TabsList>
                <TabsTrigger value="existing">Existing business (valuation)</TabsTrigger>
                <TabsTrigger value="newproject">New project (business plan)</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fm-name">
                  {form.mode === "existing" ? "Company name *" : "Project name *"}
                </Label>
                <Input
                  id="fm-name"
                  required
                  value={form.companyName}
                  onChange={(e) => set({ companyName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fm-sector">Sector / industry *</Label>
                <Input
                  id="fm-sector"
                  required
                  value={form.sector}
                  onChange={(e) => set({ sector: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fm-pack">Sector knowledge pack</Label>
                <Select
                  id="fm-pack"
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fm-currency">Currency</Label>
                  <Input
                    id="fm-currency"
                    value={form.currency}
                    onChange={(e) => set({ currency: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fm-horizon">Horizon (years)</Label>
                  <Input
                    id="fm-horizon"
                    type="number"
                    min={3}
                    max={15}
                    value={form.horizonYears}
                    onChange={(e) => set({ horizonYears: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fm-fin">
                {form.mode === "existing"
                  ? "Financial data (historical, budgets, forecasts)"
                  : "Technical & commercial inputs (quotes, studies, tariffs)"}
              </Label>
              <Textarea
                id="fm-fin"
                value={form.financialData}
                onChange={(e) => set({ financialData: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fm-ctx">Business context</Label>
              <Textarea
                id="fm-ctx"
                value={form.businessContext}
                onChange={(e) => set({ businessContext: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fm-notes">Consultant assumption notes</Label>
              <Textarea
                id="fm-notes"
                value={form.assumptionNotes}
                onChange={(e) => set({ assumptionNotes: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={loading}>
                <Sparkles /> {loading ? "Generating…" : "Generate model draft"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setForm({ ...EMPTY, mode: form.mode })}
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
            No model API key configured — a sample draft is shown. Set{" "}
            <code>LLM_API_KEY</code>, <code>LLM_BASE_URL</code> and{" "}
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
                  <CardTitle>Model draft — {form.companyName}</CardTitle>
                  {source === "model" && (
                    <CardDescription>Generated by model: {modelName}</CardDescription>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={bulkAccept} type="button">
                    <CheckCheck /> Accept all pending
                  </Button>
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

          <ReviewBoard sections={sections} onUpdate={updateElement} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Financial plan narrative (draft — edit directly)
              </CardTitle>
              <CardDescription>
                This text is carried into the Word export as the report&apos;s
                financial plan section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[160px]"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
              />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
