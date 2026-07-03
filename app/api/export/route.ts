import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
} from "docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Builds a Word (.docx) "Valuation Hypothesis — Working Paper" from the reviewed
// output. The document is explicitly labelled a preliminary working material.
export async function POST(req: NextRequest) {
  try {
    const { companyName, sections, meta } = await req.json();

    const children: Paragraph[] = [];

    children.push(
      new Paragraph({ text: "Valuation Hypothesis — Working Paper", heading: HeadingLevel.TITLE }),
      new Paragraph({
        children: [
          new TextRun({ text: companyName || "Untitled engagement", bold: true, size: 28 }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "PRELIMINARY WORKING MATERIAL — subject to professional review, source validation and internal quality control. Not a final valuation.",
            italics: true,
            color: "B00020",
          }),
        ],
      }),
    );

    if (meta) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: meta, size: 18, color: "555555" })],
        }),
      );
    }

    for (const section of sections as { title: string; items: string[] }[]) {
      children.push(
        new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }),
      );
      if (!section.items.length) {
        children.push(new Paragraph({ children: [new TextRun({ text: "—", color: "999999" })] }));
      }
      for (const item of section.items) {
        children.push(
          new Paragraph({ text: item, bullet: { level: 0 } }),
        );
      }
    }

    const doc = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(doc);

    const safeName = (companyName || "valuation-hypothesis")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}-hypothesis.docx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Export failed." },
      { status: 400 },
    );
  }
}
