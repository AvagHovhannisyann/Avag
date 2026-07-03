"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteItem, listItems, SavedItem } from "@/lib/saved";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, Trash2, TriangleAlert, Inbox } from "lucide-react";

const MODULE_META: Record<string, { label: string; href: string; variant: any }> = {
  hypothesis: { label: "Valuation Hypothesis", href: "/hypothesis", variant: "secondary" },
  "financial-model": { label: "Financial Model", href: "/financial-model", variant: "secondary" },
  "tangible-assets": { label: "Tangible Assets", href: "/tangible-assets", variant: "secondary" },
  consistency: { label: "Consistency Check", href: "/toolkit", variant: "secondary" },
};

export default function HistoryPage() {
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setItems(await listItems());
    } catch (e: any) {
      setError(e.message || "Could not load saved engagements.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: string) {
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? prev);
    try {
      await deleteItem(id);
    } catch (e: any) {
      setError(e.message || "Could not delete.");
      refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Saved engagements</h1>
        <p className="text-sm text-muted-foreground">
          Everything you&apos;ve saved across all four modules, most recent first.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {items === null && !error && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      {items && items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">
              Nothing saved yet — use the <strong>Save</strong> button after
              generating a draft in any module.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items?.map((item) => {
          const meta = MODULE_META[item.module] ?? { label: item.module, href: "/", variant: "muted" };
          return (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <Link href={`${meta.href}?id=${item.id}`}>
                  <Button size="sm" variant="outline">
                    Open <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(item.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
