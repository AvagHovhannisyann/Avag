"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveItem, SavedModule } from "@/lib/saved";
import { Save, Check, TriangleAlert } from "lucide-react";

export default function SaveButton({
  module,
  title,
  getPayload,
}: {
  module: SavedModule;
  title: string;
  getPayload: () => unknown;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setState("saving");
    setError(null);
    try {
      await saveItem(module, title, getPayload());
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch (e: any) {
      setError(e.message || "Could not save.");
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={handleSave}
        disabled={state === "saving"}
      >
        {state === "saved" ? <Check /> : state === "error" ? <TriangleAlert /> : <Save />}
        {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Save"}
      </Button>
      {state === "error" && error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
