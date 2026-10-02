import "server-only";
import { cache } from "react";

import { decodeJwtPayload, isTokenExpired } from "@/lib/auth/jwt";
import { readAccessToken } from "@/lib/auth/session-cookies";
import { fetchMerchantSession } from "@/server/modules/auth/merchant-session.service";

import type { SessionUser } from "@/types/auth";

export { readAccessToken as getAccessToken } from "@/lib/auth/session-cookies";

/**
 * The signed-in merchant user, loaded from the BE `/me` once per request.
 * Returns null when there is no usable token or the BE rejects it.
 */
export const getServerSession = cache(async (): Promise<SessionUser | null> => {
  const token = await readAccessToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload || isTokenExpired(payload)) return null;

  const result = await fetchMerchantSession();
  if (!result.success) {
    console.error("[session] /merchant/me failed", result.error.code);
    return null;
  }
  return result.data;
});
