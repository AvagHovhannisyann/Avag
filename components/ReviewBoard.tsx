"use client";

import { useMemo } from "react";
import ElementCard from "@/components/ElementCard";
import { ReviewSectionModel } from "@/lib/review";
import { ReviewedElement } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

// Generic human-in-the-loop review board shared by all agent modules.
export function useReviewStats(sections: ReviewSectionModel[]) {
  return useMemo(() => {
    const all = sections.flatMap((s) => s.elements);
    return {
      total: all.length,
      accepted: all.filter((e) => e.decision === "accepted").length,
      amended: all.filter((e) => e.decision === "amended").length,
      rejected: all.filter((e) => e.decision === "rejected").length,
      pending: all.filter((e) => e.decision === "pending").length,
    };
  }, [sections]);
}

export function ReviewStats({
  stats,
}: {
  stats: ReturnType<typeof useReviewStats>;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Badge variant="muted">{stats.total} elements</Badge>
      <Badge variant="success">{stats.accepted} accepted</Badge>
      <Badge variant="warning">{stats.amended} amended</Badge>
      <Badge variant="danger">{stats.rejected} rejected</Badge>
      <Badge variant="outline">{stats.pending} pending</Badge>
    </div>
  );
}

export default function ReviewBoard({
  sections,
  onUpdate,
}: {
  sections: ReviewSectionModel[];
  onUpdate: (sectionKey: string, next: ReviewedElement) => void;
}) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.key} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {section.title}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {section.elements.map((el) => (
              <ElementCard
                key={el.id}
                element={el}
                onChange={(next) => onUpdate(section.key, next)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
