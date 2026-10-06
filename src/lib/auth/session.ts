import "server-only";
import { cache } from "react";

import { decodeJwtPayload, describeTokenForLog, isTokenExpired } from "@/lib/auth/jwt";
import { readAccessToken } from "@/lib/auth/session-cookies";
import { fetchMerchantSession } from "@/server/modules/auth/merchant-session.service";

import type { SessionUser } from "@/types/auth";

export { readAccessToken as getAccessToken } from "@/lib/auth/session-cookies";

export type SessionState =
  | { kind: "authenticated"; user: SessionUser }
  | { kind: "unauthenticated" }
  | { kind: "unavailable" };

export const getSessionState = cache(async (): Promise<SessionState> => {
  const token = await readAccessToken();
  if (!token) return { kind: "unauthenticated" };

  const payload = decodeJwtPayload(token);
  if (!payload || isTokenExpired(payload)) return { kind: "unauthenticated" };

  let result: Awaited<ReturnType<typeof fetchMerchantSession>>;
  try {
    result = await fetchMerchantSession();
  } catch (error) {
    console.error("[session] /merchant/me failed", error);
    return { kind: "unavailable" };
  }
  if (!result.success) {
    console.error("[session] /merchant/me failed", result.error.code);
    if (process.env.NODE_ENV !== "production") {
      console.error("[session] rejected token claims", describeTokenForLog(payload));
    }
    return result.error.status === 401 && result.error.code !== "INVALID_RESPONSE"
      ? { kind: "unauthenticated" }
      : { kind: "unavailable" };
  }
  return { kind: "authenticated", user: result.data };
});

export async function getServerSession(): Promise<SessionUser | null> {
  const state = await getSessionState();
  return state.kind === "authenticated" ? state.user : null;
}
