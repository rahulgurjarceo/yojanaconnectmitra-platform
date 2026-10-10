import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sessionCookieName, verifySession } from "../../../../../lib/ycm-access-control";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(req: NextRequest) {
  const session = verifySession(req.cookies.get(sessionCookieName())?.value);
  if (!session) {
    return NextResponse.json({ success: false, code: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  }

  const state = req.nextUrl.searchParams.get("state") || "";
  const raw = req.cookies.get("ycm_digilocker_pkce")?.value || "";
  const [expectedState, codeVerifier] = raw.split(".");
  if (!state || !expectedState || !codeVerifier || !safeEqual(state, expectedState)) {
    return NextResponse.json({ success: false, code: "DIGILOCKER_OAUTH_STATE_INVALID" }, { status: 400 });
  }
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ success: false, code: "DIGILOCKER_AUTH_CODE_MISSING" }, { status: 400 });
  }

  const response = NextResponse.json({
    success: false,
    code: "DIGILOCKER_TOKEN_EXCHANGE_NOT_CONFIGURED",
    message: "Validate the approved DigiLocker requester token endpoint and credentials before enabling code exchange.",
  }, { status: 503, headers: { "Cache-Control": "no-store" } });

  response.cookies.set("ycm_digilocker_pkce", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/integrations/digilocker",
    maxAge: 0,
  });
  return response;
}
