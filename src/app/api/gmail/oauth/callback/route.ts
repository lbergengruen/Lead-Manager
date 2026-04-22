import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { exchangeCodeForTokens } from "@/gmail/oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code/state" }, { status: 400 });
  }

  const cookieState = (await cookies()).get("oauth_state")?.value;

  if (!cookieState || cookieState !== state) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  await exchangeCodeForTokens(code);

  const res = NextResponse.redirect(new URL("/settings", url));
  res.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}
