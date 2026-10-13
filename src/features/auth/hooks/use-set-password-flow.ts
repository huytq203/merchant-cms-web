"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  confirmSetPasswordOtpAction,
  requestSetPasswordOtpAction,
  resendSetPasswordOtpAction,
  retrySetPasswordAction,
} from "@/features/auth/actions/set-password-action";
import type { OtpChallengeView } from "@/features/auth/actions/login-action";
import type { SetPasswordInput } from "@/features/auth/schemas";
import { isPasswordPolicyCode } from "@/features/auth/utils/password-policy";

export type SetPasswordStep = "password" | "otp" | "done";

/** Password, then the code emailed to the account, then done. A failure keeps the step and shows its message. */
export function useSetPasswordFlow(token: string) {
  const [step, setStep] = React.useState<SetPasswordStep>("password");
  const [challenge, setChallenge] = React.useState<OtpChallengeView | null>(null);
  const [otpVersion, setOtpVersion] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  // Kept so "Quay lại" after a wrong code does not make the user type the password again.
  const [password, setPassword] = React.useState<SetPasswordInput | null>(null);
  // Set when the code was accepted but the policy rejected the password: another password goes with this session.
  const [retryRequestId, setRetryRequestId] = React.useState<string | null>(null);

  const request = useMutation({
    mutationFn: (input: SetPasswordInput) => requestSetPasswordOtpAction({ ...input, token }),
  });
  const confirmation = useMutation({
    mutationFn: (input: { requestId: string; otp: string }) => confirmSetPasswordOtpAction(input),
  });
  const retry = useMutation({
    mutationFn: (input: SetPasswordInput & { requestId: string }) => retrySetPasswordAction(input),
  });
  const resend = useMutation({
    mutationFn: (input: { requestId: string }) => resendSetPasswordOtpAction(input),
  });

  async function submitRetry(requestId: string, values: SetPasswordInput) {
    const result = await retry.mutateAsync({ ...values, requestId });
    if (result.success) {
      setRetryRequestId(null);
      return setStep("done");
    }
    if (isPasswordPolicyCode(result.code)) return setError(result.error);
    // The retry session is gone or spent: start again, with a new code.
    setRetryRequestId(null);
    setError("Phiên xác thực đã hết hạn. Vui lòng nhập mật khẩu để nhận mã OTP mới.");
  }

  async function submitPassword(values: SetPasswordInput) {
    setError(null);
    if (retryRequestId) return submitRetry(retryRequestId, values);
    const result = await request.mutateAsync(values);
    if (!result.success) return setError(result.error);
    setPassword(values);
    setChallenge(result.data);
    setOtpVersion((version) => version + 1);
    setStep("otp");
  }

  async function submitOtp(otp: string) {
    if (!challenge) return;
    setError(null);
    setNotice(null);
    const result = await confirmation.mutateAsync({ requestId: challenge.requestId, otp });
    if (!result.success && isPasswordPolicyCode(result.code)) {
      // The code is spent, so the rejected password is not kept for the next try.
      setPassword(null);
      setRetryRequestId(challenge.requestId);
      setStep("password");
      return setError(result.error);
    }
    if (!result.success) return setError(result.error);
    setPassword(null);
    setStep("done");
  }

  async function resendOtp() {
    if (!challenge) return;
    setError(null);
    const result = await resend.mutateAsync({ requestId: challenge.requestId });
    if (!result.success) return setError(result.error);
    setChallenge(result.data);
    setNotice("Đã gửi mã mới tới email của bạn.");
    setOtpVersion((version) => version + 1);
  }

  function backToPassword() {
    setStep("password");
    setError(null);
    setNotice(null);
  }

  return {
    step,
    challenge,
    otpVersion,
    error,
    notice,
    initialValues: password,
    isRetrying: retryRequestId !== null,
    isRequesting: request.isPending || retry.isPending,
    isConfirming: confirmation.isPending,
    isResending: resend.isPending,
    submitPassword,
    submitOtp,
    resendOtp,
    backToPassword,
  };
}
