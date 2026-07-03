import { NextRequest, NextResponse } from "next/server";
import {
  ConsistencyInputSchema,
  ConsistencyOutputSchema,
  CONSISTENCY_SYSTEM_PROMPT,
  buildConsistencyUserPrompt,
  demoConsistency,
} from "@/lib/consistency";
import { llmJson } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const input = ConsistencyInputSchema.parse(await req.json());
    const result = await llmJson({
      system: CONSISTENCY_SYSTEM_PROMPT,
      user: buildConsistencyUserPrompt(input),
      schema: ConsistencyOutputSchema,
      demo: () => demoConsistency(input),
    });
    return NextResponse.json({
      output: result.data,
      source: result.source,
      model: result.model,
    });
  } catch (err: any) {
    const message =
      err?.issues?.map((i: any) => i.message).join("; ") ||
      err?.message ||
      "Consistency check failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
