import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { caseId, amount, currency = "INR", service = "Legal Consultation" } = await req.json();
    if (!caseId || !amount) return NextResponse.json({ error: "caseId and amount are required." }, { status: 400 });

    const checkoutUrl = process.env.LEGAL_PAYMENT_CHECKOUT_URL;
    if (!checkoutUrl) {
      return NextResponse.json({
        ok: false,
        status: "PAYMENT_PROVIDER_NOT_CONFIGURED",
        message: "Configure a server-side payment provider before accepting payments.",
        order: { caseId, amount, currency, service }
      }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      checkoutUrl,
      order: { caseId, amount, currency, service }
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
