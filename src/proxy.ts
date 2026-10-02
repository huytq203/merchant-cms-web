import { NextResponse, type NextRequest } from "next/server";

import {
  DASHBOARD_PATH,
  LOGIN_PATH,
  decideAuthAction,
  mergeCookieHeader,
} from "@/lib/auth/auth-routing";
import { AUTH_COOKIES } from "@/lib/auth/cookies";
import { buildSessionCookies, type CookieSpec } from "@/lib/auth/session-cookies";
import { refreshTokensOnce } from "@/server/modules/auth/merchant-auth.service";

function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin") ?? "";
  const isVercelOrigin =
    origin.endsWith(".vercel.app") || origin === "http://localhost:3000";

  if (request.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (isVercelOrigin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      );
      res.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Accept",
      );
    }
    return res;
  }
  return null;
}

function redirectTo(request: NextRequest, pathname: string, callbackUrl?: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(url);
}

function applyCookies(response: NextResponse, specs: CookieSpec[]): NextResponse {
  for (const spec of specs) response.cookies.set(spec.name, spec.value, spec.options);
  return response;
}

function clearCookies(response: NextResponse): NextResponse {
  response.cookies.delete(AUTH_COOKIES.ACCESS_TOKEN);
  response.cookies.delete(AUTH_COOKIES.REFRESH_TOKEN);
  return response;
}

async function handleRefresh(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const refreshToken = request.cookies.get(AUTH_COOKIES.REFRESH_TOKEN)?.value ?? "";
  const result = await refreshTokensOnce(refreshToken);

  if (!result.success) {
    const response =
      pathname === LOGIN_PATH ? NextResponse.next() : redirectTo(request, LOGIN_PATH, pathname + search);
    return clearCookies(response);
  }

  const specs = buildSessionCookies(result.data, { secure: process.env.NODE_ENV === "production" });
  if (pathname === LOGIN_PATH) return applyCookies(redirectTo(request, DASHBOARD_PATH), specs);

  const headers = new Headers(request.headers);
  headers.set("cookie", mergeCookieHeader(request.headers.get("cookie"), specs));
  return applyCookies(NextResponse.next({ request: { headers } }), specs);
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return handleCors(request) ?? NextResponse.next();
  }

  const action = decideAuthAction({
    pathname,
    hasAccessToken: Boolean(request.cookies.get(AUTH_COOKIES.ACCESS_TOKEN)?.value),
    hasRefreshToken: Boolean(request.cookies.get(AUTH_COOKIES.REFRESH_TOKEN)?.value),
  });

  switch (action) {
    case "allow":
      return NextResponse.next();
    case "redirect-dashboard":
      return redirectTo(request, DASHBOARD_PATH);
    case "redirect-login":
      return redirectTo(request, LOGIN_PATH, pathname + search);
    case "refresh":
      return handleRefresh(request);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
