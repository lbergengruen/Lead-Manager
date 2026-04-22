import { NextResponse } from "next/server";

import { disconnectGoogle } from "@/gmail/oauth";

export async function POST(request: Request) {
  await disconnectGoogle();

  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/settings", url));
}
