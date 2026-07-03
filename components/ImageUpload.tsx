"use client";

import { useRef, useState } from "react";
import { UploadedImage, fileToUploadedImage, approxKB, MAX_IMAGES } from "@/lib/images";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";

export default function ImageUpload({
  images,
  onChange,
  label = "Supporting images",
  hint = "Photos, scans or screenshots — e.g. asset condition, financial statement pages, listing or report excerpts.",
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const room = MAX_IMAGES - images.length;
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, room));
    if (!picked.length) return;
    setBusy(true);
    try {
      const next = await Promise.all(picked.map(fileToUploadedImage));
      onChange([...images, ...next]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground">
          {images.length}/{MAX_IMAGES}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">{hint}</p>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {images.map((img, i) => (
            <div
              key={`${img.name}-${i}`}
              className="group relative overflow-hidden rounded-md border bg-muted/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataUrl}
                alt={img.name}
                className="h-20 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Remove ${img.name}`}
              >
                <X className="h-3 w-3" />
              </button>
              <div className="truncate bg-card/90 px-1 py-0.5 text-[9px] text-muted-foreground">
                {approxKB(img.dataUrl)} KB
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || images.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {busy ? "Processing…" : "Add images"}
        </Button>
      </div>
    </div>
  );
}
