"use client";

import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/lib/api/auth-api";
import { ApiError } from "@/lib/http/api-client";

import type { SessionUser } from "@/types/auth";

export const sessionQueryKey = ["auth", "session"] as const;

/**
 * Hook lấy thông tin phiên đăng nhập.
 * 1. Gọi /auth/me — nếu 401 (access token hết hạn)
 * 2. Tự động gọi /auth/refresh để lấy token mới rồi trả session
 * Server Component dùng `getServerSession()` thay thế.
 */
export function useSessionQuery(initialData?: SessionUser) {
  return useQuery<SessionUser | null, Error, SessionUser | undefined>({
    queryKey: sessionQueryKey,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          try {
            return await authApi.refresh();
          } catch {
            return null;
          }
        }
        throw err;
      }
    },
    select: (data) => data ?? undefined,
    initialData,
    staleTime: 4 * 60 * 1000,
    retry: false,
  });
}
