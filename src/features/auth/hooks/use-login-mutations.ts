"use client";

import { useMutation } from "@tanstack/react-query";

import {
  loginAction,
  resendLoginOtpAction,
  verifyLoginOtpAction,
} from "@/features/auth/actions/login-action";
import type { LoginInput } from "@/features/auth/schemas";

export function useLoginMutation() {
  return useMutation({ mutationFn: (input: LoginInput) => loginAction(input) });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: (input: { requestId: string; otp: string }) => verifyLoginOtpAction(input),
  });
}

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: (input: { requestId: string }) => resendLoginOtpAction(input),
  });
}
