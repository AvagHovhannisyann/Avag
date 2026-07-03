import { NextRequest, NextResponse } from "next/server";
import { ValuationInputSchema } from "@/lib/types";
import { generateHypothesis } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = ValuationInputSchema.parse(body);
    const result = await generateHypothesis(input);
    return NextResponse.json(result);
  } catch (err: any) {
    const message =
      err?.issues?.map((i: any) => i.message).join("; ") ||
      err?.message ||
      "Failed to generate hypothesis.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
