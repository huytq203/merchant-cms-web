"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import TealLogo from "../../../../public/brand/logo-teal-yellow.webp";
import { Button } from "@/components/ui/button/Button";
import type { OtpChallengeView } from "@/features/auth/actions/login-action";
import { CredentialsStep } from "@/features/auth/components/credentials-step";
import { OtpPanel } from "@/features/auth/components/otp-panel";
import {
  useLoginMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
} from "@/features/auth/hooks/use-login-mutations";
import type { LoginInput } from "@/features/auth/schemas";
import { safeCallback } from "@/features/auth/utils/safe-callback";

interface LoginFormPanelProps {
  onForgotPassword: () => void;
}

export function LoginFormPanel({ onForgotPassword }: LoginFormPanelProps) {
  const router = useRouter();
  const callbackUrl = safeCallback(useSearchParams().get("callbackUrl"));

  const login = useLoginMutation();
  const verify = useVerifyOtpMutation();
  const resend = useResendOtpMutation();

  const [challenge, setChallenge] = React.useState<OtpChallengeView | null>(null);
  const [otpVersion, setOtpVersion] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = React.useState<string | null>(null);

  async function handleLogin(values: LoginInput) {
    setError(null);
    const result = await login.mutateAsync(values);
    if (!result.success) return setError(result.error);
    setChallenge(result.data);
  }

  async function handleVerify(otp: string) {
    if (!challenge) return;
    setError(null);
    setNoticeMessage(null);
    const result = await verify.mutateAsync({ requestId: challenge.requestId, otp });
    if (!result.success) return setError(result.error);
    router.replace(callbackUrl);
    router.refresh();
  }

  async function handleResend() {
    if (!challenge) return;
    setError(null);
    const result = await resend.mutateAsync({ requestId: challenge.requestId });
    if (!result.success) return setError(result.error);
    setChallenge(result.data);
    setNoticeMessage("Đã gửi mã mới tới email của bạn.");
    setOtpVersion((version) => version + 1);
  }

  function handleBack() {
    setChallenge(null);
    setError(null);
    setNoticeMessage(null);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background md:min-w-[22rem]">
      <header className="flex flex-col gap-2 px-6 pt-6">
        <Image src={TealLogo} alt="Flexpay" width={720} height={212} className="mx-auto h-10 w-auto md:hidden" priority />
        <div className="flex min-h-9 items-center">
          {challenge && (
            <Button type="button" variant="ghost" size="sm" leftIcon={<ArrowLeft className="size-4" aria-hidden />} onClick={handleBack}>
              Quay lại
            </Button>
          )}
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
        {challenge ? (
          <OtpPanel
            key={otpVersion}
            maskedRecipient={challenge.maskedRecipient}
            expiresInSeconds={challenge.expiresInSeconds}
            resendAfterSeconds={challenge.resendAfterSeconds}
            resendRemaining={challenge.resendRemaining}
            isSubmitting={verify.isPending}
            isResending={resend.isPending}
            errorMessage={error}
            noticeMessage={noticeMessage}
            onSubmit={handleVerify}
            onResend={handleResend}
          />
        ) : (
          <CredentialsStep
            isSubmitting={login.isPending}
            errorMessage={error}
            onSubmit={handleLogin}
            onForgotPassword={onForgotPassword}
          />
        )}
      </div>
    </div>
  );
}
