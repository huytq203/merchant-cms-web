import type { JwtPayload } from "@/types/auth";

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
    const payload = JSON.parse(json) as JwtPayload;

    if (typeof payload !== "object" || !payload) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JwtPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}
