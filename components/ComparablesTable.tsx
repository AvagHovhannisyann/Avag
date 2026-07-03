"use client";

import {
  CompRow,
  adjustedValue,
  netOfVat,
  totalAdjustmentPct,
  indicatedRange,
  fmt,
} from "@/lib/tangibleCalc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function NumCell({
  value,
  onChange,
  className,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  step?: number;
}) {
  return (
    <Input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("h-8 w-20 px-2 text-right text-xs", className)}
    />
  );
}

export default function ComparablesTable({
  rows,
  onRowsChange,
  vatRate,
  onVatRateChange,
  targetCurrency,
}: {
  rows: CompRow[];
  onRowsChange: (rows: CompRow[]) => void;
  vatRate: number;
  onVatRateChange: (v: number) => void;
  targetCurrency: string;
}) {
  const setRow = (id: string, patch: Partial<CompRow>) =>
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const range = indicatedRange(rows, vatRate);
  const mixedCurrency = new Set(rows.filter((r) => r.include).map((r) => r.currency)).size > 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              Comparables calculation table
            </CardTitle>
            <CardDescription>
              Deterministic — every figure is consultant-controlled. Pipeline:
              price × FX → net of VAT → × (1 + Σ adjustments).
            </CardDescription>
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="vat" className="text-xs">
                VAT rate %
              </Label>
              <NumCell value={vatRate} onChange={onVatRateChange} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mixedCurrency && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Included comparables use different currencies — set the FX column so
            all values convert to {targetCurrency} at the valuation date.
          </p>
        )}

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[1100px] border-collapse text-xs">
            <thead>
              <tr className="bg-primary text-left text-primary-foreground">
                {[
                  "Incl.",
                  "Comparable",
                  "Price",
                  "Ccy",
                  `FX→${targetCurrency}`,
                  "VAT incl.",
                  "Country",
                  "Date",
                  "Transp. %",
                  "Customs %",
                  "Cond. %",
                  "Age/wear %",
                  "Other %",
                  `Adjusted (${targetCurrency})`,
                ].map((h) => (
                  <th key={h} className="whitespace-nowrap px-2 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={cn("border-t", !r.include && "opacity-50")}
                >
                  <td className="px-2 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={r.include}
                      onChange={(e) => setRow(r.id, { include: e.target.checked })}
                      className="h-4 w-4 accent-[#1B3A6B]"
                    />
                  </td>
                  <td className="max-w-[220px] px-2 py-1.5">
                    <div className="font-medium leading-snug">{r.name}</div>
                    <div className="text-[10px] text-muted-foreground">{r.source}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <NumCell
                      value={r.price}
                      onChange={(v) => setRow(r.id, { price: v })}
                      className="w-24"
                    />
                  </td>
                  <td className="px-2 py-1.5">{r.currency}</td>
                  <td className="px-2 py-1.5">
                    <NumCell
                      value={r.fxRate}
                      step={0.0001}
                      onChange={(v) => setRow(r.id, { fxRate: v })}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={r.vatIncluded}
                      onChange={(e) => setRow(r.id, { vatIncluded: e.target.checked })}
                      className="h-4 w-4 accent-[#1B3A6B]"
                    />
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5">{r.country}</td>
                  <td className="whitespace-nowrap px-2 py-1.5">{r.dateObserved}</td>
                  {(
                    [
                      "adjTransport",
                      "adjCustoms",
                      "adjCondition",
                      "adjAge",
                      "adjOther",
                    ] as const
                  ).map((k) => (
                    <td key={k} className="px-2 py-1.5">
                      <NumCell
                        value={r[k]}
                        step={0.5}
                        onChange={(v) => setRow(r.id, { [k]: v } as Partial<CompRow>)}
                        className="w-16"
                      />
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-2 py-1.5 text-right font-semibold">
                    {r.include && r.price > 0 ? fmt(adjustedValue(r, vatRate)) : "—"}
                    <div className="text-[10px] font-normal text-muted-foreground">
                      net {r.include && r.price > 0 ? fmt(netOfVat(r, vatRate)) : "—"} ·{" "}
                      {totalAdjustmentPct(r) > 0 ? "+" : ""}
                      {totalAdjustmentPct(r)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {range ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Indicated range ({range.count} comparables):
            </span>
            <Badge variant="secondary">min {fmt(range.min)}</Badge>
            <Badge>median {fmt(range.median)}</Badge>
            <Badge variant="secondary">mean {fmt(range.mean)}</Badge>
            <Badge variant="secondary">max {fmt(range.max)}</Badge>
            <span className="text-xs text-muted-foreground">{targetCurrency}</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Include at least one comparable with a price to see the indicated range.
          </p>
        )}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          The indicated range is an arithmetic aid, not a value conclusion. The
          final fair/market value remains a matter of professional judgment,
          reconciliation and internal quality control.
        </p>
      </CardContent>
    </Card>
  );
}
