import "server-only";
import { cookies } from "next/headers";

import { AUTH_COOKIES } from "@/lib/auth/cookies";
import { decodeJwtPayload, isTokenExpired } from "@/lib/auth/jwt";

import type { SessionUser } from "@/types/auth";

/**
 * Đọc phiên đăng nhập từ cookie HTTP-only ở Server Component / Server Action.
 * Trả về null nếu chưa đăng nhập hoặc token hết hạn.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIES.ACCESS_TOKEN)?.value;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload || isTokenExpired(payload)) return null;

  return {
    userId: payload.userId,
    username: payload.username,
    email: payload.email,
    phone: payload.phone,
    permissionGroupId: payload.permissionGroupId,
    permissionName: payload.permissionName,
  };
}

/** Lấy access token thô để đính vào header Authorization. */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIES.ACCESS_TOKEN)?.value ?? null;
}
