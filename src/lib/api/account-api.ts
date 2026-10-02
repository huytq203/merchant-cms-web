import { apiClient } from "@/lib/http/api-client";
import type { UpdateProfileInput } from "../../features/account/schemas";

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const accountApi = {
  updateProfile: (data: UpdateProfileInput) =>
    apiClient.patch<void>("/v1/admin/auth/profile", data),
  changePassword: (data: ChangePasswordPayload) =>
    apiClient.post<void>("/v1/admin/auth/change-password", data),
};
