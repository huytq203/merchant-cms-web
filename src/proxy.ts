import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIES } from "@/lib/auth/cookies";

const PUBLIC_PATHS = new Set<string>(["/login"]);
const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

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

export function proxy(request: NextRequest) {
  // Handle CORS preflight cho API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    const corsResponse = handleCors(request);
    if (corsResponse) return corsResponse;
    return NextResponse.next();
  }

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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
