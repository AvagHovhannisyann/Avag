"use client";

import { useState } from "react";
import { SECTOR_PACKS } from "@/lib/sectors";
import { ConsistencyOutput } from "@/lib/consistency";
import WaccCalculator from "@/components/WaccCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ScanSearch, TriangleAlert } from "lucide-react";

const severityVariant: Record<string, "danger" | "warning" | "muted"> = {
  high: "danger",
  medium: "warning",
  low: "muted",
};

export default function ToolkitPage() {
  const [modelExtract, setModelExtract] = useState("");
  const [reportExtract, setReportExtract] = useState("");
  const [pptExtract, setPptExtract] = useState("");
  const [context, setContext] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkSource, setCheckSource] = useState<"model" | "demo" | null>(null);
  const [result, setResult] = useState<ConsistencyOutput | null>(null);

  async function runCheck(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setCheckError(null);
    setCheckSource(null);
    try {
      const res = await fetch("/api/consistency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelExtract,
          reportExtract,
          presentationExtract: pptExtract,
          context,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed.");
      setResult(data.output);
      setCheckSource(data.source);
    } catch (e: any) {
      setCheckError(e.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Toolkit & Sector Knowledge</h1>
        <p className="text-sm text-muted-foreground">
          Phase 4 · functional utilities and sectoral knowledge layers shared by
          the agent modules.
        </p>
      </div>

      <Tabs defaultValue="wacc">
        <TabsList>
          <TabsTrigger value="wacc">WACC calculator</TabsTrigger>
          <TabsTrigger value="sectors">Sector knowledge packs</TabsTrigger>
          <TabsTrigger value="consistency">Consistency checker</TabsTrigger>
        </TabsList>

        <TabsContent value="wacc">
          <WaccCalculator />
        </TabsContent>

        <TabsContent value="sectors" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Priority industries from the proposal. Packs are injected into the
            Hypothesis and Financial Model agents via the “Sector knowledge
            pack” selector, and grow with each engagement.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {SECTOR_PACKS.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <CardDescription>{p.valuationNotes}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Value drivers
                    </div>
                    <ul className="list-disc space-y-0.5 pl-5">
                      {p.valueDrivers.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Key risks
                    </div>
                    <ul className="list-disc space-y-0.5 pl-5">
                      {p.risks.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.typicalMultiples.map((m) => (
                      <Badge key={m} variant="secondary">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consistency" className="space-y-4">
          <Card>
            <form onSubmit={runCheck}>
              <CardHeader>
                <CardTitle className="text-base">
                  Excel ↔ Word ↔ PowerPoint consistency check
                </CardTitle>
                <CardDescription>
                  Paste extracts from each document; the checker flags mismatched
                  figures, assumptions, units and terminology.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cc-context">Engagement context (optional)</Label>
                  <Input
                    id="cc-context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g. Valuation of Ararat Foods LLC, June 2026"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cc-model">Excel model extract *</Label>
                    <Textarea
                      id="cc-model"
                      required
                      className="min-h-[140px]"
                      value={modelExtract}
                      onChange={(e) => setModelExtract(e.target.value)}
                      placeholder="Key outputs, assumptions, scenario table…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cc-report">Word report extract *</Label>
                    <Textarea
                      id="cc-report"
                      required
                      className="min-h-[140px]"
                      value={reportExtract}
                      onChange={(e) => setReportExtract(e.target.value)}
                      placeholder="Narrative paragraphs, tables…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cc-ppt">PowerPoint extract (optional)</Label>
                    <Textarea
                      id="cc-ppt"
                      className="min-h-[140px]"
                      value={pptExtract}
                      onChange={(e) => setPptExtract(e.target.value)}
                      placeholder="Slide bullets, headline figures…"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={checking}>
                  <ScanSearch /> {checking ? "Checking…" : "Run consistency check"}
                </Button>
              </CardContent>
            </form>
          </Card>

          {checkError && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{checkError}</AlertDescription>
            </Alert>
          )}

          {checkSource === "demo" && result && (
            <Alert variant="warning">
              <Info className="h-4 w-4" />
              <AlertTitle>Demo mode</AlertTitle>
              <AlertDescription>
                No model API key configured — indicative sample findings are
                shown rather than a real comparison of your extracts.
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Findings</CardTitle>
                <CardDescription>{result.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.findings.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No inconsistencies identified in the provided extracts.
                  </p>
                )}
                {result.findings.map((f, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-snug">{f.finding}</p>
                      <Badge variant={severityVariant[f.severity] ?? "muted"}>
                        {f.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Where: {f.locations}
                    </p>
                    <p className="mt-1.5 text-xs">
                      <span className="font-semibold">Suggestion: </span>
                      {f.suggestion}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
