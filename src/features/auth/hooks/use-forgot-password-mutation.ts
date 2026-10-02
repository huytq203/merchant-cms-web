import { useMutation } from "@tanstack/react-query";

import { authApi } from "@/lib/api/auth-api";

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (payload: { email: string }) => authApi.forgotPassword(payload),
  });
}
