import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth-api";

type ForgotPasswordPayload = { username?: string; email?: string };

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) =>
      authApi.forgotPassword(payload),
  });
}
