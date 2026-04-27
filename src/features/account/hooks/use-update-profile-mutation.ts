"use client";

import { useMutation } from "@tanstack/react-query";
import { accountApi } from "../api/account-api";
import type { UpdateProfileInput } from "../schemas";

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => accountApi.updateProfile(data),
  });
}
