import { NextRequest, NextResponse } from "next/server";
import {
  TangibleInputSchema,
  TangibleOutputSchema,
  TANGIBLE_SYSTEM_PROMPT,
  buildTangibleUserPrompt,
  demoTangible,
} from "@/lib/tangible";
import { llmJson } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const input = TangibleInputSchema.parse(await req.json());
    const result = await llmJson({
      system: TANGIBLE_SYSTEM_PROMPT,
      user: buildTangibleUserPrompt(input),
      schema: TangibleOutputSchema,
      demo: () => demoTangible(input),
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
      "Failed to structure market evidence.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
