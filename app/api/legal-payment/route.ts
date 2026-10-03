import { NextResponse } from "next/server";
import { sessionCookieName, verifySession } from "../../lib/ycm-access-control";

export const runtime = "nodejs";

function readCookie(req: Request, name: string) {
  const header = req.headers.get("cookie") ?? "";
  const part = header.split(";").map((v) => v.trim()).find((v) => v.startsWith(name + "="));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : undefined;
}

export async function POST(req: Request) {
  const session = verifySession(readCookie(req, sessionCookieName()));
  if (!session) return NextResponse.json({ ok: false, code: "AUTHENTICATION_REQUIRED" }, { status: 401 });

  try {
    const body = await req.json().catch(() => null) as {
      caseId?: unknown;
      amount?: unknown;
      currency?: unknown;
      service?: unknown;
    } | null;
    const caseId = typeof body?.caseId === "string" ? body.caseId.trim() : "";
    const amount = typeof body?.amount === "number" ? body.amount : Number(body?.amount);
    const currency = typeof body?.currency === "string" ? body.currency.trim().toUpperCase() : "INR";
    const service = typeof body?.service === "string" && body.service.trim() ? body.service.trim() : "Legal Consultation";

    if (!caseId || !Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
      return NextResponse.json({ ok: false, error: "caseId and a valid positive amount are required." }, { status: 400 });
    }
    if (currency !== "INR") {
      return NextResponse.json({ ok: false, code: "UNSUPPORTED_CURRENCY" }, { status: 400 });
    }

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
