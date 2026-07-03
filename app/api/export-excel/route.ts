import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BDO_NAVY = "FF1B3A6B";
const BDO_RED = "FFE81A3B";
const LIGHT = "FFF1F5F9";

interface SheetSpec {
  name: string;
  columns: { header: string; width?: number }[];
  rows: (string | number | null)[][];
}

// Standardized financial model structure — the proposal's stated output for the
// financial modeling workstream. Line items down the rows, years across.
function addModelSkeleton(
  wb: ExcelJS.Workbook,
  currency: string,
  years: number,
) {
  const ws = wb.addWorksheet("Model skeleton");
  const yearCols = Array.from({ length: years }, (_, i) => `Y${i + 1}`);
  ws.columns = [
    { header: "Line item", width: 38 },
    ...yearCols.map((y) => ({ header: `${y} (${currency})`, width: 14 })),
  ];

  const groups: { title: string; items: string[] }[] = [
    { title: "REVENUE", items: ["Volume", "Price", "Total revenue"] },
    { title: "OPERATING COSTS", items: ["Variable costs (COGS)", "Gross profit", "Fixed overheads", "EBITDA"] },
    { title: "DEPRECIATION & EBIT", items: ["Depreciation & amortization", "EBIT"] },
    { title: "CAPEX", items: ["Maintenance CAPEX", "Growth CAPEX"] },
    { title: "WORKING CAPITAL", items: ["Receivables (DSO)", "Inventory (DIO)", "Payables (DPO)", "Change in NWC"] },
    { title: "FINANCING", items: ["Debt drawdown / (repayment)", "Interest expense"] },
    { title: "TAX", items: ["Profit tax"] },
    { title: "FREE CASH FLOW", items: ["Unlevered free cash flow"] },
  ];

  for (const group of groups) {
    const titleRow = ws.addRow([group.title]);
    titleRow.font = { bold: true, color: { argb: BDO_NAVY } };
    titleRow.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: LIGHT },
    };
    for (const item of group.items) {
      ws.addRow([item, ...yearCols.map(() => null)]);
    }
  }
  styleHeader(ws);
  return ws;
}

function styleHeader(ws: ExcelJS.Worksheet) {
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BDO_NAVY } };
    cell.border = { bottom: { style: "thin", color: { argb: BDO_RED } } };
  });
  header.height = 18;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, sheets, modelSkeleton } = body as {
      filename?: string;
      sheets?: SheetSpec[];
      modelSkeleton?: { currency: string; years: number };
    };

    const wb = new ExcelJS.Workbook();
    wb.creator = "BDO Deal Advisory AI Suite";
    wb.created = new Date();

    for (const spec of sheets ?? []) {
      const ws = wb.addWorksheet(spec.name.slice(0, 31));
      ws.columns = spec.columns.map((c) => ({
        header: c.header,
        width: c.width ?? 24,
      }));
      for (const row of spec.rows) ws.addRow(row);
      styleHeader(ws);
      // Zebra striping for readability.
      for (let r = 2; r <= ws.rowCount; r++) {
        if (r % 2 === 0) {
          ws.getRow(r).eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
          });
        }
        ws.getRow(r).alignment = { vertical: "top", wrapText: true };
      }
    }

    if (modelSkeleton) {
      addModelSkeleton(wb, modelSkeleton.currency || "USD", modelSkeleton.years || 5);
    }

    if (wb.worksheets.length === 0) {
      return NextResponse.json({ error: "Nothing to export." }, { status: 400 });
    }

    // Disclaimer sheet — every exported workbook carries the working-material note.
    const note = wb.addWorksheet("Note");
    note.columns = [{ header: "Preliminary working material", width: 110 }];
    note.addRow([
      "Prepared by the BDO Deal Advisory AI Suite. Contents are preliminary working materials subject to professional review, source validation and internal quality control. Not a final valuation, financial model or report.",
    ]);
    styleHeader(note);
    note.getRow(2).alignment = { wrapText: true, vertical: "top" };

    const buffer = await wb.xlsx.writeBuffer();
    const safe = (filename || "bdo-working-paper")
      .replace(/[^a-z0-9._-]+/gi, "-")
      .toLowerCase();

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safe.endsWith(".xlsx") ? safe : safe + ".xlsx"}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Excel export failed." },
      { status: 400 },
    );
  }
}
