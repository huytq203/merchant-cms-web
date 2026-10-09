"use client";

import { Mail } from "lucide-react";
import { OtpEntry } from "@/components/form/OtpEntry";
import type { WithdrawalCreateFlow } from "../hooks/use-withdrawal-create-flow";

/** Step 3: the code emailed to the user. Sending it is what creates the request. */
export function WithdrawalOtpStep({ flow }: { flow: WithdrawalCreateFlow }) {
  const { challenge } = flow;
  if (!challenge) return null;
  return (
    <div className="mx-auto grid w-full max-w-md justify-items-center gap-3 py-2 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <Mail className="size-6" aria-hidden />
      </span>
      <p className="text-sm text-muted-foreground">
        {`Nhập mã 6 số đã gửi tới email ${challenge.maskedRecipient} để xác nhận yêu cầu rút tiền.`}
      </p>
      <div className="w-full text-left">
        <OtpEntry
          key={challenge.otpSessionId}
          challenge={challenge}
          isSubmitting={flow.isSending}
          isResending={flow.isRequestingCode}
          failure={flow.otpFailure}
          notice={null}
          submitLabel="Gửi yêu cầu"
          backLabel="Quay lại"
          onSubmit={(otp) => void flow.confirm(otp)}
          onResend={() => void flow.resend()}
          onBack={flow.back}
        />
      </div>
    </div>
  );
}
