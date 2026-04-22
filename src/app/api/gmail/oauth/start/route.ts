import { NextResponse } from "next/server";

import { buildGoogleAuthUrl, createStateToken } from "@/gmail/oauth";

export async function GET() {
  const state = createStateToken();
  const url = buildGoogleAuthUrl(state);

  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 10 * 60
  });

  return res;
}
