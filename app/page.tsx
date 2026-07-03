import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Lightbulb,
  Table2,
  Building2,
  Calculator,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const modules = [
  {
    href: "/hypothesis",
    icon: Lightbulb,
    phase: "Phase 1",
    title: "Valuation Hypothesis Agent",
    description:
      "Form an initial valuation logic — approaches, value drivers, assumptions, comparables, risks and open questions — then accept, amend or reject each element.",
  },
  {
    href: "/financial-model",
    icon: Table2,
    phase: "Phase 2",
    title: "Financial Model & Business Plan",
    description:
      "Normalize financial statements, structure the assumption book across revenue, OPEX, CAPEX, working capital, debt and tax, run consistency checks and draft the financial plan narrative.",
  },
  {
    href: "/tangible-assets",
    icon: Building2,
    phase: "Phase 3",
    title: "Tangible Asset Valuation",
    description:
      "Structure market comparables with source, date, country, VAT and currency; apply transport, customs, condition and age adjustments; compute the indicated value range.",
  },
  {
    href: "/toolkit",
    icon: Calculator,
    phase: "Phase 4",
    title: "Toolkit & Sector Knowledge",
    description:
      "WACC build-up calculator, sector knowledge packs for priority industries, and a cross-document consistency checker for model, report and presentation.",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-gradient-to-br from-bdo-navy to-[#12294c] px-6 py-10 text-white shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-5 w-1 rounded-sm bg-bdo-red" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
              BDO Armenia · Deal Advisory
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight">
            AI tools for valuation and financial modeling
          </h1>
          <p className="text-sm leading-relaxed text-white/80">
            Structured first drafts for valuation hypotheses, financial models,
            business plans and tangible asset valuations — so consultants spend
            less time on mechanical preparation and more on challenging
            assumptions, interpreting results and refining conclusions.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {modules.map(({ href, icon: Icon, phase, title, description }) => (
          <Card key={href} className="flex flex-col transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary">{phase}</Badge>
              </div>
              <CardTitle className="pt-2 text-base">{title}</CardTitle>
              <CardDescription className="leading-relaxed">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Link href={href}>
                <Button variant="outline" size="sm">
                  Open module <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert variant="info">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Governing principle</AlertTitle>
        <AlertDescription>
          AI outputs are preliminary working materials that support — never
          replace — professional judgment. Final valuation approaches,
          assumptions, calculations, conclusions and reports remain subject to
          professional review, source validation and internal quality control.
          Use dummy or anonymized data with third-party model APIs; confidential
          client data requires the self-hosted model configuration.
        </AlertDescription>
      </Alert>
    </div>
  );
}
