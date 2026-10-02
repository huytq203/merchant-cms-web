"use client";

import { useMutation } from "@tanstack/react-query";
import { accountApi } from "../../../lib/api/account-api";

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (data: ChangePasswordPayload) =>
      accountApi.changePassword(data),
  });
}
