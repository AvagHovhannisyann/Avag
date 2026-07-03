"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic WACC build-up (CAPM). No AI involved — a functional Deal
// Advisory utility exactly as scoped in the proposal ("benchmarking, WACC
// calculation"). All inputs are percentages except beta and D/E.
//   βL   = βU × (1 + (1 − t) × D/E)
//   Ke   = Rf + βL × ERP + CRP + Size + Specific
//   WACC = Ke × E/V + Kd × (1 − t) × D/V
// ─────────────────────────────────────────────────────────────────────────────

interface WaccInputs {
  rf: number;
  erp: number;
  betaU: number;
  de: number; // D/E ratio (e.g. 0.43)
  tax: number;
  crp: number;
  size: number;
  specific: number;
  kd: number; // pre-tax cost of debt
  dv: number; // D/V weight (%)
}

const DEFAULTS: WaccInputs = {
  rf: 4.2,
  erp: 5.5,
  betaU: 0.85,
  de: 0.43,
  tax: 18,
  crp: 3.0,
  size: 2.0,
  specific: 1.0,
  kd: 10.0,
  dv: 30,
};

function Field({
  id,
  label,
  value,
  onChange,
  step = 0.1,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function WaccCalculator() {
  const [v, setV] = useState<WaccInputs>(DEFAULTS);
  const set = (patch: Partial<WaccInputs>) => setV((p) => ({ ...p, ...patch }));

  const calc = useMemo(() => {
    const betaL = v.betaU * (1 + (1 - v.tax / 100) * v.de);
    const ke = v.rf + betaL * v.erp + v.crp + v.size + v.specific;
    const kdAfterTax = v.kd * (1 - v.tax / 100);
    const dv = Math.min(Math.max(v.dv, 0), 100) / 100;
    const wacc = ke * (1 - dv) + kdAfterTax * dv;
    return { betaL, ke, kdAfterTax, wacc };
  }, [v]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">WACC build-up calculator</CardTitle>
        <CardDescription>
          Deterministic CAPM build-up — a functional utility, no AI involved.
          Source each input (risk-free, ERP, betas, CRP) per internal
          methodology.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Field id="rf" label="Risk-free rate %" value={v.rf} onChange={(x) => set({ rf: x })} />
          <Field id="erp" label="Equity risk premium %" value={v.erp} onChange={(x) => set({ erp: x })} />
          <Field
            id="betaU"
            label="Unlevered beta"
            step={0.01}
            value={v.betaU}
            onChange={(x) => set({ betaU: x })}
            hint="Sector median, unlevered"
          />
          <Field
            id="de"
            label="Target D/E"
            step={0.01}
            value={v.de}
            onChange={(x) => set({ de: x })}
            hint="Ratio, e.g. 0.43"
          />
          <Field id="tax" label="Tax rate %" value={v.tax} onChange={(x) => set({ tax: x })} />
          <Field id="crp" label="Country risk premium %" value={v.crp} onChange={(x) => set({ crp: x })} />
          <Field id="size" label="Size premium %" value={v.size} onChange={(x) => set({ size: x })} />
          <Field
            id="specific"
            label="Specific risk %"
            value={v.specific}
            onChange={(x) => set({ specific: x })}
            hint="Company-specific premium"
          />
          <Field id="kd" label="Cost of debt (pre-tax) %" value={v.kd} onChange={(x) => set({ kd: x })} />
          <Field
            id="dv"
            label="Debt / (D+E) %"
            value={v.dv}
            onChange={(x) => set({ dv: x })}
            hint="Capital structure weight"
          />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Relevered beta
            </div>
            <div className="text-lg font-bold">{calc.betaL.toFixed(2)}</div>
            <div className="text-[11px] text-muted-foreground">
              βU × (1 + (1−t) × D/E)
            </div>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Cost of equity (Ke)
            </div>
            <div className="text-lg font-bold">{calc.ke.toFixed(2)}%</div>
            <div className="text-[11px] text-muted-foreground">
              Rf + βL×ERP + CRP + Size + Specific
            </div>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              After-tax cost of debt
            </div>
            <div className="text-lg font-bold">{calc.kdAfterTax.toFixed(2)}%</div>
            <div className="text-[11px] text-muted-foreground">Kd × (1 − t)</div>
          </div>
          <div className="rounded-lg border-2 border-primary bg-accent p-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-widest text-primary">
                WACC
              </div>
              <Badge>result</Badge>
            </div>
            <div className="text-2xl font-extrabold text-primary">
              {calc.wacc.toFixed(2)}%
            </div>
            <div className="text-[11px] text-muted-foreground">
              Ke×E/V + Kd(1−t)×D/V
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
