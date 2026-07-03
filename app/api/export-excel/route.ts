import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { dataUrlToBuffer, readImageDimensions } from "@/lib/imageDims";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TO_XLSX_EXT: Record<string, "jpeg" | "png" | "gif"> = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/png": "png",
  "image/gif": "gif",
};

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

// Adds a "Supporting images" sheet, stacking each uploaded image with a name
// label above it, sized to its natural aspect ratio (capped) via the workbook
// image API.
function addImagesSheet(wb: ExcelJS.Workbook, images: { name: string; dataUrl: string }[]) {
  const ws = wb.addWorksheet("Supporting images");
  ws.columns = [{ header: "Supporting images (as uploaded by the consultant)", width: 90 }];
  styleHeader(ws);

  const maxWidthPx = 520;
  const maxHeightPx = 380;
  let rowCursor = 3;

  for (const img of images) {
    try {
      const { buffer, mime } = dataUrlToBuffer(img.dataUrl);
      const extension = MIME_TO_XLSX_EXT[mime] ?? "jpeg";
      const dims = readImageDimensions(buffer);
      const scale = dims
        ? Math.min(maxWidthPx / dims.width, maxHeightPx / dims.height, 1)
        : 1;
      const width = dims ? Math.round(dims.width * scale) : maxWidthPx;
      const height = dims ? Math.round(dims.height * scale) : maxHeightPx;

      ws.getCell(`A${rowCursor}`).value = img.name;
      ws.getCell(`A${rowCursor}`).font = { bold: true };
      rowCursor += 1;

      const imageId = wb.addImage({ base64: buffer.toString("base64"), extension });
      ws.addImage(imageId, {
        tl: { col: 0, row: rowCursor - 1 },
        ext: { width, height },
      } as any);

      // Reserve enough rows (≈20px each) for the image before the next label.
      rowCursor += Math.ceil(height / 20) + 2;
    } catch {
      ws.getCell(`A${rowCursor}`).value = `[Could not embed image: ${img.name}]`;
      rowCursor += 2;
    }
  }
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
    const { filename, sheets, modelSkeleton, images } = body as {
      filename?: string;
      sheets?: SheetSpec[];
      modelSkeleton?: { currency: string; years: number };
      images?: { name: string; dataUrl: string }[];
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

    if (images && images.length) {
      addImagesSheet(wb, images);
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
