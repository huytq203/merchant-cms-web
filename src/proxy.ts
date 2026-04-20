import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIES } from "@/lib/auth/cookies";

const PUBLIC_PATHS = new Set<string>(["/login"]);
const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get(AUTH_COOKIES.ACCESS_TOKEN)?.value;
  const isAuthenticated = Boolean(accessToken);
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname === LOGIN_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = DASHBOARD_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
