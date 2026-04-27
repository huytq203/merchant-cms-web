"use client";

import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/lib/api/auth-api";
import { ApiError } from "@/lib/http/api-client";

import type { SessionUser } from "@/types/auth";

export const sessionQueryKey = ["auth", "session"] as const;

/**
 * Hook lấy thông tin phiên đăng nhập từ BE (/auth/me hoặc /auth/refresh).
 * Dùng khi Client Component cần biết thông tin user theo thời gian thực.
 * Server Component nên dùng `getServerSession()` từ lib/auth/session.ts.
 */
export function useSessionQuery(initialData?: SessionUser | null) {
  return useQuery<SessionUser | null>({
    queryKey: sessionQueryKey,
    queryFn: async () => {
      try {
        return await authApi.refresh();
      } catch (err) {
        if (
          err instanceof ApiError &&
          (err.status === 401 || err.status === 403)
        ) {
          return null;
        }
        throw err;
      }
    },
    initialData: initialData ?? undefined,
    staleTime: 4 * 60 * 1000,
    retry: false,
  });
}
