import { apiClient } from "@/lib/http/api-client";

import type { LoginInput } from "@/features/auth/schemas";
import type { LoginResponse, SessionUser } from "@/types/auth";
import { refresh } from "next/cache";

export const authApi = {
  login: (input: LoginInput) =>
    apiClient.post<LoginResponse>("/v1/admin/auth/login", input),
  logout: () => apiClient.post<void>("/v1/admin/auth/login"),
  refresh: () => apiClient.get<SessionUser>("/v1/admin/auth/refresh"),
};
