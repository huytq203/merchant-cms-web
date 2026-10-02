import { NextResponse, type NextRequest } from "next/server";

import { clearSessionCookies } from "@/lib/auth/session-cookies";

/** Clears expired session cookies before returning to login. */
export async function GET(request: NextRequest) {
  await clearSessionCookies();
  return NextResponse.redirect(new URL("/login", request.url));
}
