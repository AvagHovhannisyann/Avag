"use client";

import { ReviewedElement, Decision } from "@/lib/types";

const decisionStyles: Record<Decision, string> = {
  pending: "bg-slate-100 text-slate-600",
  accepted: "bg-emerald-100 text-emerald-800",
  amended: "bg-amber-100 text-amber-800",
  rejected: "bg-rose-100 text-rose-800",
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

  return (
    <div className={`card ${rejected ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm leading-relaxed ${rejected ? "line-through" : ""}`}>
          {element.original}
        </p>
        <span className={`chip shrink-0 ${decisionStyles[element.decision]}`}>
          {element.decision}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={`chip cursor-pointer border ${
            element.decision === "accepted"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() => set({ decision: "accepted" })}
        >
          ✓ Accept
        </button>
        <button
          type="button"
          className={`chip cursor-pointer border ${
            element.decision === "amended"
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() =>
            set({ decision: "amended", amended: element.amended || element.original })
          }
        >
          ✎ Amend
        </button>
        <button
          type="button"
          className={`chip cursor-pointer border ${
            element.decision === "rejected"
              ? "border-rose-300 bg-rose-50 text-rose-800"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() => set({ decision: "rejected" })}
        >
          ✕ Reject
        </button>
      </div>

      {element.decision === "amended" && (
        <textarea
          className="textarea mt-3"
          value={element.amended}
          onChange={(e) => set({ amended: e.target.value })}
          placeholder="Amend the proposed text…"
        />
      )}

      {element.decision !== "rejected" && (
        <input
          className="input mt-2"
          value={element.note}
          onChange={(e) => set({ note: e.target.value })}
          placeholder="Reviewer note (optional)"
        />
      )}
    </div>
  );
}
