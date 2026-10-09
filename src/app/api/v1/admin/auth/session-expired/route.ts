import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { safeCallback } from "@/features/auth/utils/safe-callback";
import { clearSessionCookies, readRefreshToken, writeSessionCookies } from "@/lib/auth/session-cookies";
import { isRefreshRejected, refreshTokensOnce } from "@/server/modules/auth/merchant-auth.service";

/** Marks a refresh made here, so a session the BE still refuses ends instead of looping. */
const REFRESHED_COOKIE = "session_refreshed";
const REFRESHED_COOKIE_MAX_AGE = 30;

async function logout(request: NextRequest): Promise<NextResponse> {
  await clearSessionCookies();
  (await cookies()).delete(REFRESHED_COOKIE);
  return NextResponse.redirect(new URL("/login", request.url));
}

/**
 * A page found no usable session. Tries the refresh token first and only logs out when the refresh
 * is rejected, or when a refresh made moments ago still did not give a session the BE accepts.
 */
export async function GET(request: NextRequest) {
  const store = await cookies();
  const refreshToken = await readRefreshToken();
  if (!refreshToken || store.get(REFRESHED_COOKIE)) return logout(request);

  const result = await refreshTokensOnce(refreshToken);
  if (!result.success) {
    if (isRefreshRejected(result.error)) return logout(request);
    // Identity is unavailable: keep the tokens; the proxy refreshes again on the login page.
    return NextResponse.redirect(new URL("/login", request.url));
  }

  await writeSessionCookies(result.data);
  store.set(REFRESHED_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: REFRESHED_COOKIE_MAX_AGE });
  const callbackUrl = safeCallback(new URL(request.url).searchParams.get("callbackUrl"));
  return NextResponse.redirect(new URL(callbackUrl, request.url));
}
