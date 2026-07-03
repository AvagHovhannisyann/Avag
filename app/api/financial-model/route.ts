import { NextRequest, NextResponse } from "next/server";
import {
  FinModelInputSchema,
  FinModelOutputSchema,
  FINMODEL_SYSTEM_PROMPT,
  buildFinModelUserPrompt,
  demoFinModel,
} from "@/lib/finmodel";
import { llmJson } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const input = FinModelInputSchema.parse(await req.json());
    const result = await llmJson({
      system: FINMODEL_SYSTEM_PROMPT,
      user: buildFinModelUserPrompt(input),
      schema: FinModelOutputSchema,
      demo: () => demoFinModel(input),
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
      "Failed to generate financial model draft.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
