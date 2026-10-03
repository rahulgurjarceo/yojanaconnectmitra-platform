import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName, verifySession } from "../../../../lib/ycm-access-control";

export const runtime = "nodejs";

function config() {
  return {
    authorizationUrl: process.env.DIGILOCKER_AUTHORIZATION_URL,
    clientId: process.env.DIGILOCKER_CLIENT_ID,
    redirectUri: process.env.DIGILOCKER_REDIRECT_URI,
  };
}

export async function GET(req: NextRequest) {
  const session = verifySession(req.cookies.get(sessionCookieName())?.value);
  if (!session) {
    const response = NextResponse.json({ success: false, code: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  }

  const c = config();
  if (!c.authorizationUrl || !c.clientId || !c.redirectUri) {
    return NextResponse.json({
      success: false,
      code: "DIGILOCKER_NOT_CONFIGURED",
      message: "Configure the approved DigiLocker/API Setu client credentials and callback before enabling live OAuth.",
    }, { status: 503 });
  }

  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge = Buffer.from(digest).toString("base64url");
  const url = new URL(c.authorizationUrl);
  url.searchParams.set("client_id", c.clientId);
  url.searchParams.set("redirect_uri", c.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.json({
    success: true,
    authorizationUrl: url.toString(),
    state,
    codeChallenge,
    mode: "oauth-foundation",
  }, { headers: { "Cache-Control": "no-store" } });

  response.cookies.set("ycm_digilocker_pkce", `${state}.${codeVerifier}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/integrations/digilocker",
    maxAge: 600,
  });
  return response;
}
