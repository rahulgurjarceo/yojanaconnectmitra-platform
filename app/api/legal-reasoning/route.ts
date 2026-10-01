import { NextResponse } from "next/server";
import { buildCaseReasoningChecklist } from "@/app/legal-mitra/case-reasoning";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.facts || typeof body.facts !== "string" || body.facts.trim().length < 20) {
      return NextResponse.json({ error: "At least 20 characters of case facts are required." }, { status: 400 });
    }

    const report = buildCaseReasoningChecklist({
      facts: body.facts,
      category: body.category,
      jurisdiction: body.jurisdiction,
    });

    return NextResponse.json({
      ok: true,
      report,
      sourcePolicy: {
        primaryFirst: true,
        currentAuthorityRequired: true,
        humanLawyerReview: true,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid reasoning request." }, { status: 400 });
  }
}
