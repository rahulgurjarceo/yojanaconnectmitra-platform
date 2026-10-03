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
    return NextResponse.json({ success: false, code: "AUTHENTICATION_REQUIRED" }, { status: 401 });
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
  const url = new URL(c.authorizationUrl);
  url.searchParams.set("client_id", c.clientId);
  url.searchParams.set("redirect_uri", c.redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.json({
    success: true,
    authorizationUrl: url.toString(),
    state,
    mode: "oauth-foundation",
  }, { headers: { "Cache-Control": "no-store" } });
}
