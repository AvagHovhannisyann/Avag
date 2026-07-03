import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  ImageRun,
} from "docx";
import { dataUrlToBuffer, readImageDimensions, fitWithin } from "@/lib/imageDims";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TO_DOCX_TYPE: Record<string, "jpg" | "png" | "gif" | "bmp"> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

// Builds a Word (.docx) working paper from the reviewed output, optionally
// with an appendix of the supporting images the consultant uploaded. The
// document is explicitly labelled a preliminary working material.
export async function POST(req: NextRequest) {
  try {
    const { companyName, sections, meta, docTitle, images } = await req.json();

    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        text: docTitle || "Valuation Hypothesis — Working Paper",
        heading: HeadingLevel.TITLE,
      }),
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

    const uploadedImages = (images ?? []) as { name: string; dataUrl: string }[];
    if (uploadedImages.length) {
      children.push(
        new Paragraph({ text: "Appendix — Supporting materials", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Images uploaded by the consultant during the engagement, reproduced here for reference.",
              italics: true,
              color: "555555",
            }),
          ],
        }),
      );
      for (const img of uploadedImages) {
        try {
          const { buffer, mime } = dataUrlToBuffer(img.dataUrl);
          const type = MIME_TO_DOCX_TYPE[mime] ?? "jpg";
          const dims = fitWithin(readImageDimensions(buffer), 500, 400);
          children.push(
            new Paragraph({
              children: [new TextRun({ text: img.name, bold: true, size: 18 })],
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  type,
                  data: buffer,
                  transformation: dims,
                }),
              ],
            }),
          );
        } catch {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `[Could not embed image: ${img.name}]`, color: "999999" })],
            }),
          );
        }
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
