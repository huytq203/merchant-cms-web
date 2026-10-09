import "server-only";
import { cookies } from "next/headers";

import { AUTH_COOKIES, COOKIE_OPTIONS } from "@/lib/auth/cookies";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import type { TokenPair } from "@/server/modules/auth/merchant-auth.dto";

export interface CookieSpec {
  name: string;
  value: string;
  options: { httpOnly: true; sameSite: "lax"; path: string; secure: boolean; maxAge: number };
}

export async function readAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIES.ACCESS_TOKEN)?.value ?? null;
}

export async function readRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIES.REFRESH_TOKEN)?.value ?? null;
}

/** How long before the JWT exp the access cookie disappears, so the proxy refreshes before BE calls fail. */
const ACCESS_REFRESH_LEAD_SECONDS = 60;

function accessMaxAge(tokens: TokenPair, nowMs: number): number {
  const payload = decodeJwtPayload(tokens.accessToken);
  const lifetime = payload ? Math.floor(payload.exp - nowMs / 1000) : tokens.expiresIn;
  if (lifetime <= 0) return 0;
  // A short-lived token keeps half its lifetime; dropping the cookie at once would refresh on every request.
  return lifetime - Math.min(ACCESS_REFRESH_LEAD_SECONDS, Math.floor(lifetime / 2));
}

/** Pure: the cookies to set after a login or refresh. The access cookie expires a little before the token. */
export function buildSessionCookies(
  tokens: TokenPair,
  options: { secure: boolean; nowMs?: number },
): CookieSpec[] {
  const base = { ...COOKIE_OPTIONS, httpOnly: true as const, secure: options.secure };
  return [
    {
      name: AUTH_COOKIES.ACCESS_TOKEN,
      value: tokens.accessToken,
      options: { ...base, maxAge: accessMaxAge(tokens, options.nowMs ?? Date.now()) },
    },
    {
      name: AUTH_COOKIES.REFRESH_TOKEN,
      value: tokens.refreshToken,
      options: { ...base, maxAge: tokens.refreshExpiresIn },
    },
  ];
}

export async function writeSessionCookies(tokens: TokenPair): Promise<void> {
  const store = await cookies();
  const specs = buildSessionCookies(tokens, { secure: process.env.NODE_ENV === "production" });
  for (const spec of specs) store.set(spec.name, spec.value, spec.options);
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIES.ACCESS_TOKEN);
  store.delete(AUTH_COOKIES.REFRESH_TOKEN);
}
