import type { Metadata } from "next";
import "./globals.css";
import BdoLogo from "@/components/BdoLogo";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "BDO Deal Advisory — AI Suite",
  description:
    "AI-supported valuation, financial modeling and tangible asset workflows for BDO Armenia Deal Advisory. Preliminary working materials only.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3 pl-2">
              <BdoLogo compact />
              <div className="h-6 w-px bg-border" />
              <div>
                <div className="text-sm font-semibold leading-tight">
                  Deal Advisory AI Suite
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight">
                  Preliminary working materials · human-in-the-loop
                </div>
              </div>
            </div>
            <NavLinks />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t bg-card">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
            AI-generated outputs are preliminary working materials, subject to
            professional review, source validation and internal quality control
            procedures. They do not replace professional judgment and do not
            constitute a final valuation, financial model or report.
          </div>
        </footer>
      </body>
    </html>
  );
}
