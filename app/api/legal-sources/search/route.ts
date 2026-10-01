import { NextResponse } from "next/server";
import { buildLegalSearchPlan } from "@/app/legal-mitra/legal-source-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.query || !body?.country) {
      return NextResponse.json({ error: "Query and country are required." }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      plan: buildLegalSearchPlan({
        query: String(body.query),
        country: String(body.country),
        jurisdiction: String(body.jurisdiction || ""),
        category: body.category ? String(body.category) : undefined,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
