"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  confirmSetPasswordOtpAction,
  requestSetPasswordOtpAction,
  resendSetPasswordOtpAction,
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

  const request = useMutation({
    mutationFn: (input: SetPasswordInput) => requestSetPasswordOtpAction({ ...input, token }),
  });
  const confirmation = useMutation({
    mutationFn: (input: { requestId: string; otp: string }) => confirmSetPasswordOtpAction(input),
  });
  const resend = useMutation({
    mutationFn: (input: { requestId: string }) => resendSetPasswordOtpAction(input),
  });

  async function submitPassword(values: SetPasswordInput) {
    setError(null);
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
      // The code is spent and the password was refused: back to the form with the reason, and a new code comes with the next try.
      setPassword(null);
      setStep("password");
      return setError(`${result.error}. Hãy chọn mật khẩu khác, bạn sẽ nhận mã OTP mới.`);
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
    isRequesting: request.isPending,
    isConfirming: confirmation.isPending,
    isResending: resend.isPending,
    submitPassword,
    submitOtp,
    resendOtp,
    backToPassword,
  };
}
