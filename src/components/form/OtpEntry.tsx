"use client";

import { useState, type ClipboardEvent } from "react";
import { AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { InputOTP } from "@/components/ui/input-otp/InputOtp";
import { useCountdown } from "@/features/auth/hooks/use-countdown";
import { OTP_LENGTH, type SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { cn } from "@/lib/utils/cn";

type Props = {
  challenge: SensitiveOtpChallenge;
  isSubmitting: boolean;
  isResending: boolean;
  /** Message of the last failed attempt, shown under the code. */
  failure: string | null;
  notice: string | null;
  submitLabel?: string;
  backLabel?: string;
  /** Where the actions sit: `end` inside a dialog footer, `center` on a page card. */
  align?: "end" | "center";
  onSubmit: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
};

const formatClock = (seconds: number): string =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

function Meta({ expiryLeft, resendLeft, isResending, onResend }: {
  expiryLeft: number;
  resendLeft: number;
  isResending: boolean;
  onResend: () => void;
}) {
  const expired = expiryLeft === 0;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
      <span className={cn("inline-flex items-center gap-1.5", expired && "text-danger")}>
        <Clock className="size-4" aria-hidden />
        {expired ? "Mã đã hết hạn" : `Hết hạn sau ${formatClock(expiryLeft)}`}
      </span>
      <Button type="button" variant="link" disabled={resendLeft > 0 || isResending} onClick={onResend}>
        {resendLeft > 0 ? `Gửi lại sau ${resendLeft} giây` : "Gửi lại mã"}
      </Button>
    </div>
  );
}

/**
 * The code boxes, countdowns and actions of an email OTP. Mount it with `key={challenge.otpSessionId}`
 * so a resent code restarts both countdowns and clears the input.
 */
export function OtpEntry(props: Props) {
  const { challenge, isSubmitting, isResending, failure, notice, onSubmit, onResend, onBack } = props;
  const { submitLabel = "Xác nhận", backLabel = "Quay lại", align = "end" } = props;
  const [code, setCode] = useState("");
  const { secondsLeft: expiryLeft } = useCountdown(challenge.expiresInSeconds);
  const { secondsLeft: resendLeft } = useCountdown(challenge.canResendAfterSeconds);
  const expired = expiryLeft === 0;

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\s/g, "");
    if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(pasted) || isSubmitting || expired) return;
    event.preventDefault();
    event.stopPropagation();
    setCode(pasted);
    onSubmit(pasted);
  };

  return (
    <div className="grid gap-4">
      <div onPasteCapture={handlePaste} className="[&>div>p]:hidden">
        <InputOTP
          length={OTP_LENGTH}
          size="sm"
          separatorAfter={3}
          separator={<span className="w-2" aria-hidden />}
          className="w-full justify-center gap-1.5"
          slotClassName="h-12 min-w-0 flex-1 max-w-[48px] text-xl"
          value={code}
          onChange={setCode}
          error={Boolean(failure) || expired}
          disabled={isSubmitting}
          autoFocus
        />
      </div>
      {failure && (
        <p role="alert" className="flex items-start gap-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {failure}
        </p>
      )}
      {!failure && notice && <p role="status" className="text-sm text-primary">{notice}</p>}
      <Meta expiryLeft={expiryLeft} resendLeft={resendLeft} isResending={isResending} onResend={onResend} />
      <div className={cn("flex flex-wrap gap-2", align === "end" ? "justify-end" : "flex-col items-center")}>
        {align === "end" && <Button type="button" variant="ghost" onClick={onBack}>{backLabel}</Button>}
        <Button
          type="button"
          variant="solid"
          isLoading={isSubmitting}
          disabled={code.length !== OTP_LENGTH || isSubmitting || expired}
          onClick={() => onSubmit(code)}
        >
          {submitLabel}
        </Button>
        {align === "center" && <Button type="button" variant="link" onClick={onBack}>{backLabel}</Button>}
      </div>
    </div>
  );
}
