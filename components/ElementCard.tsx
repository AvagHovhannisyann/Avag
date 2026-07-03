"use client";

import { ReviewedElement, Decision } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Check, PencilLine, X } from "lucide-react";
import { cn } from "@/lib/utils";

const decisionBadge: Record<Decision, { variant: any; label: string }> = {
  pending: { variant: "muted", label: "Pending" },
  accepted: { variant: "success", label: "Accepted" },
  amended: { variant: "warning", label: "Amended" },
  rejected: { variant: "danger", label: "Rejected" },
};

export default function ElementCard({
  element,
  onChange,
}: {
  element: ReviewedElement;
  onChange: (next: ReviewedElement) => void;
}) {
  const set = (patch: Partial<ReviewedElement>) => onChange({ ...element, ...patch });
  const rejected = element.decision === "rejected";
  const badge = decisionBadge[element.decision];

  return (
    <Card className={cn("p-4", rejected && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-sm leading-relaxed", rejected && "line-through")}>
          {element.original}
        </p>
        <Badge variant={badge.variant} className="shrink-0">
          {badge.label}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={element.decision === "accepted" ? "default" : "outline"}
          onClick={() => set({ decision: "accepted" })}
        >
          <Check /> Accept
        </Button>
        <Button
          type="button"
          size="sm"
          variant={element.decision === "amended" ? "secondary" : "outline"}
          onClick={() =>
            set({ decision: "amended", amended: element.amended || element.original })
          }
        >
          <PencilLine /> Amend
        </Button>
        <Button
          type="button"
          size="sm"
          variant={element.decision === "rejected" ? "destructive" : "outline"}
          onClick={() => set({ decision: "rejected" })}
        >
          <X /> Reject
        </Button>
      </div>

      {element.decision === "amended" && (
        <Textarea
          className="mt-3"
          value={element.amended}
          onChange={(e) => set({ amended: e.target.value })}
          placeholder="Amend the proposed text…"
        />
      )}

      {element.decision !== "rejected" && (
        <Input
          className="mt-2"
          value={element.note}
          onChange={(e) => set({ note: e.target.value })}
          placeholder="Reviewer note (optional)"
        />
      )}
    </Card>
  );
}
