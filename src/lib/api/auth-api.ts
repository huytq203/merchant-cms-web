import { apiClient } from "@/lib/http/api-client";

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export const authApi = {
  forgotPassword: (input: { email: string }) =>
    apiClient.post<ForgotPasswordResponse>("/v1/admin/auth/forgot-password", input),
};
