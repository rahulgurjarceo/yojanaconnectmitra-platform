import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name || !body?.phone || !body?.address || !body?.description) {
      return NextResponse.json({ error: "Name, mobile, address and case description are required." }, { status: 400 });
    }
    const stamp = Date.now().toString().slice(-8);
    const caseId = `YCM-LGL-${new Date().getFullYear()}-${stamp}`;
    // Production hook: persist to YCM CRM/Postgres here, then trigger AI classification,
    // document checklist, lawyer/legal-aid routing and payment-order creation.
    return NextResponse.json({
      ok: true,
      caseId,
      next: ["client_confirmation","ai_classification","document_checklist","lawyer_or_legal_aid_routing","payment"],
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
