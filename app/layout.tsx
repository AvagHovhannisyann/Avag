import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BDO Deal Advisory — Valuation Hypothesis Agent",
  description:
    "AI-supported initial valuation hypothesis for BDO Armenia Deal Advisory. Preliminary working materials only.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-6 w-1.5 rounded-sm bg-bdo-red" />
              <span className="text-xl font-extrabold tracking-tight text-bdo-blue">
                BDO
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-sm font-semibold leading-tight">
                Valuation Hypothesis Agent
              </div>
              <div className="text-xs text-slate-500 leading-tight">
                Deal Advisory · preliminary working materials
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-400">
          AI-generated outputs are preliminary working materials, subject to
          professional review, source validation and internal quality control.
          They do not constitute a final valuation.
        </footer>
      </body>
    </html>
  );
}
