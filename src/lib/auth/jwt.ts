import type { JwtPayload } from "@/types/auth";

export interface TokenLogView {
  iss: string | undefined;
  azp: string | undefined;
  typ: string | undefined;
  aud: string | string[] | undefined;
  roles: string[] | undefined;
  realmRoles: string[] | undefined;
  iat: number | undefined;
  exp: number;
  secondsToExpiry: number;
}

/** Non-sensitive claims only, for diagnosing why the BE rejects a token. Never include sub, e-mail or names. */
export function describeTokenForLog(payload: JwtPayload, nowSeconds: number = Math.floor(Date.now() / 1000)): TokenLogView {
  return {
    iss: payload.iss,
    azp: payload.azp,
    typ: payload.typ,
    aud: payload.aud,
    roles: payload.roles,
    realmRoles: payload.realm_access?.roles,
    iat: payload.iat,
    exp: payload.exp,
    secondsToExpiry: payload.exp - nowSeconds,
  };
}

/**
 * Decode phần payload của JWT mà không verify chữ ký.
 * Chỉ dùng để đọc thông tin user ở server-side — KHÔNG dùng để xác thực.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = (parts[1] ?? "")
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const json = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(json) as unknown;

    if (typeof payload !== "object" || !payload || typeof (payload as Record<string, unknown>).exp !== "number") return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JwtPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}
