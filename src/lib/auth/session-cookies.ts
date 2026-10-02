import "server-only";
import { cookies } from "next/headers";

import { AUTH_COOKIES } from "@/lib/auth/cookies";

export async function readAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIES.ACCESS_TOKEN)?.value ?? null;
}

export async function readRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIES.REFRESH_TOKEN)?.value ?? null;
}
