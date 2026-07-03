"use client";

import { useState } from "react";
import HypothesisForm from "@/components/HypothesisForm";
import ReviewBoard, { ReviewStats, useReviewStats } from "@/components/ReviewBoard";
import { ValuationInput, Hypothesis, ReviewedElement } from "@/lib/types";
import {
  ReviewSectionModel,
  toReviewSections,
  toExportSections,
} from "@/lib/review";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { downloadBlob } from "@/lib/download";
import { UploadedImage } from "@/lib/images";
import { CheckCheck, FileDown, Info, TriangleAlert } from "lucide-react";

export default function HypothesisPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"model" | "demo" | null>(null);
  const [modelName, setModelName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [summary, setSummary] = useState("");
  const [sections, setSections] = useState<ReviewSectionModel[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [exporting, setExporting] = useState(false);

  const stats = useReviewStats(sections);

  async function handleGenerate(input: ValuationInput) {
    setLoading(true);
    setError(null);
    setSource(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      const hypothesis = data.hypothesis as Hypothesis;
      setCompanyName(input.companyName);
      setSummary(hypothesis.summary);
      setSections(toReviewSections(hypothesis));
      setImages(input.images ?? []);
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

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const meta = `Reviewed ${stats.accepted + stats.amended} of ${stats.total} proposed elements · ${new Date().toLocaleString()}`;
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docTitle: "Valuation Hypothesis — Working Paper",
          companyName,
          meta,
          sections: [
            { title: "Summary", items: summary ? [summary] : [] },
            ...toExportSections(sections),
          ],
          images,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Export failed.");
      }
      downloadBlob(await res.blob(), `${companyName || "valuation"}-hypothesis.docx`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Valuation Hypothesis Agent</h1>
        <p className="text-sm text-muted-foreground">
          Phase 1 · initial valuation logic across income, market and cost
          approaches — for the consultant to challenge, test, amend, accept or
          reject.
        </p>
      </div>

      <HypothesisForm onSubmit={handleGenerate} loading={loading} />

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
            No model API key configured — a sample hypothesis is shown. Set{" "}
            <code>LLM_API_KEY</code>, <code>LLM_BASE_URL</code> and{" "}
            <code>LLM_MODEL</code> to use a real model.
          </AlertDescription>
        </Alert>
      )}

      {sections.length > 0 && (
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Valuation hypothesis — {companyName}</CardTitle>
                  {source === "model" && (
                    <CardDescription>Generated by model: {modelName}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={bulkAccept} type="button">
                    <CheckCheck /> Accept all pending
                  </Button>
                  <Button size="sm" onClick={handleExport} type="button" disabled={exporting}>
                    <FileDown /> {exporting ? "Exporting…" : "Export to Word"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">{summary}</p>
              <ReviewStats stats={stats} />
            </CardContent>
          </Card>

          <ReviewBoard sections={sections} onUpdate={updateElement} />
        </section>
      )}
    </div>
  );
}
