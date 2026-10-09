"use client";

import { Mail } from "lucide-react";
import { OtpEntry } from "@/components/form/OtpEntry";
import type { useKybFlow } from "../hooks/use-kyb-flow";

type Props = { flow: ReturnType<typeof useKybFlow> };

export function KybOtpStep({ flow }: Props) {
  const { challenge } = flow;
  if (!challenge) return null;
  return (
    <div className="mx-auto grid w-full max-w-md justify-items-center gap-3 py-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <Mail className="size-7" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold text-foreground">Xác thực OTP</h3>
      <p className="text-sm text-muted-foreground">
        {`Nhập mã 6 số đã gửi tới email ${challenge.maskedRecipient} để xác nhận bạn là người gửi hồ sơ.`}
      </p>
      <div className="w-full text-left">
        <OtpEntry
          key={challenge.otpSessionId}
          challenge={challenge}
          isSubmitting={flow.isSending}
          isResending={flow.isResending}
          failure={flow.otpFailure}
          notice={flow.notice}
          submitLabel={flow.verified ? "Xác nhận và gửi lại hồ sơ" : "Xác nhận và gửi hồ sơ"}
          backLabel="Quay lại chỉnh sửa"
          align="center"
          onSubmit={(otp) => void flow.confirm(otp)}
          onResend={() => void flow.resend()}
          onBack={flow.backToForm}
        />
      </div>
    </div>
  );
}
