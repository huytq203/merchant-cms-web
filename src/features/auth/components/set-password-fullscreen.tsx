"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import TealLogo from "../../../../public/brand/logo-teal-yellow.webp";
import { Button } from "@/components/ui/button/Button";
import type { SetPasswordLink } from "@/features/auth/actions/set-password-action";
import { LoginBrandPanel } from "@/features/auth/components/login-brand-panel";
import { OtpPanel } from "@/features/auth/components/otp-panel";
import { useSetPasswordFlow } from "@/features/auth/hooks/use-set-password-flow";
import { SetPasswordForm } from "./set-password-form";
import { InvalidLinkNotice, PasswordSetNotice } from "./set-password-result";

type Props = { token: string; link: SetPasswordLink };

/** The page the activation and forgot-password emails link to: same frame as the login page. */
export function SetPasswordFullScreen({ token, link }: Props) {
  const flow = useSetPasswordFlow(token);

  return (
    <div className="flex h-screen w-full">
      <LoginBrandPanel />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background md:min-w-[22rem]">
        <header className="flex flex-col gap-2 px-6 pt-6">
          <Image src={TealLogo} alt="Flexpay" width={720} height={212} className="mx-auto h-10 w-auto md:hidden" priority />
          <div className="flex min-h-9 items-center">
            {flow.step === "otp" && (
              <Button type="button" variant="ghost" size="sm" leftIcon={<ArrowLeft className="size-4" aria-hidden />} onClick={flow.backToPassword}>
                Quay lại
              </Button>
            )}
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          {!link.valid ? <InvalidLinkNotice /> : null}
          {link.valid && flow.step === "password" ? (
            <SetPasswordForm
              maskedEmail={link.maskedEmail}
              initialValues={flow.initialValues}
              isSubmitting={flow.isRequesting}
              errorMessage={flow.error}
              onSubmit={(values) => void flow.submitPassword(values)}
            />
          ) : null}
          {link.valid && flow.step === "otp" && flow.challenge ? (
            <OtpPanel
              key={flow.otpVersion}
              maskedRecipient={flow.challenge.maskedRecipient}
              expiresInSeconds={flow.challenge.expiresInSeconds}
              resendAfterSeconds={flow.challenge.resendAfterSeconds}
              resendRemaining={flow.challenge.resendRemaining}
              isSubmitting={flow.isConfirming}
              isResending={flow.isResending}
              errorMessage={flow.error}
              noticeMessage={flow.notice}
              onSubmit={(otp) => void flow.submitOtp(otp)}
              onResend={() => void flow.resendOtp()}
            />
          ) : null}
          {link.valid && flow.step === "done" ? <PasswordSetNotice /> : null}
        </div>
      </div>
    </div>
  );
}
