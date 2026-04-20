"use client";

import { useMutation } from "@tanstack/react-query";

import { loginAction } from "@/features/auth/actions/login-action";

import type { LoginInput } from "@/features/auth/schemas";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (input: LoginInput) => loginAction(input),
  });
}
