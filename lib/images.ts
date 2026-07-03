import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Shared image-upload support, used by all four modules. Photos of assets,
// scans of financial statements, or screenshots of listings/reports/slides can
// carry information that is awkward to transcribe by hand. Images are resized
// and re-encoded client-side before upload to keep API payloads small.
// ─────────────────────────────────────────────────────────────────────────────

export const UploadedImageSchema = z.object({
  name: z.string(),
  dataUrl: z.string().startsWith("data:image/", "Must be an image data URL"),
});
export type UploadedImage = z.infer<typeof UploadedImageSchema>;

export const MAX_IMAGES = 6;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

// Downscales and re-encodes an image file to a JPEG data URL in the browser,
// so a 10MB phone photo becomes a few hundred KB before it ever leaves the
// client. Falls back to the original file if canvas encoding fails.
export async function fileToUploadedImage(file: File): Promise<UploadedImage> {
  const original = await readFileAsDataUrl(file);
  try {
    const img = await loadImage(original);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    return { name: file.name, dataUrl };
  } catch {
    return { name: file.name, dataUrl: original };
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = dataUrl;
  });
}

export function approxKB(dataUrl: string): number {
  // Base64 is ~4/3 the size of the raw bytes.
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.round((base64.length * 0.75) / 1024);
}

// Used by demo-mode generators to visibly acknowledge uploaded images even
// though no real vision model is being called offline.
export function imageAckNote(images?: UploadedImage[] | { name: string }[]): string {
  if (!images || !images.length) return "";
  return ` (${images.length} supporting image${images.length > 1 ? "s" : ""} were provided and would be reviewed by a configured vision-capable model.)`;
}
