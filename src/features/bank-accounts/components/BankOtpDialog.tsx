"use client";

import { useState, type ClipboardEvent } from "react";
import { AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { InputOTP } from "@/components/ui/input-otp/InputOtp";
import { useCountdown } from "@/features/auth/hooks/use-countdown";
import { OTP_LENGTH } from "../schemas/bank-account-request.schema";
import type { BankErrorView } from "../utils/bank-errors";
import type { BankOtpChallenge } from "../types";

type Props = {
  open: boolean;
  challenge: BankOtpChallenge | null;
  isSubmitting: boolean;
  isResending: boolean;
  failure: BankErrorView | null;
  notice: string | null;
  onSubmit: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
};

const formatClock = (seconds: number): string =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

type MetaProps = { expiryLeft: number; resendLeft: number; isResending: boolean; onResend: () => void };

function BankOtpMeta({ expiryLeft, resendLeft, isResending, onResend }: MetaProps) {
  const expired = expiryLeft === 0;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
      <span className={`inline-flex items-center gap-1.5 ${expired ? "text-danger" : ""}`}>
        <Clock className="size-4" aria-hidden />
        {expired ? "Mã đã hết hạn" : `Hết hạn sau ${formatClock(expiryLeft)}`}
      </span>
      <Button type="button" variant="link" disabled={resendLeft > 0 || isResending} onClick={onResend}>
        {resendLeft > 0 ? `Gửi lại sau ${resendLeft} giây` : "Gửi lại mã"}
      </Button>
    </div>
  );
}

type BodyProps = Omit<Props, "open" | "challenge"> & { challenge: BankOtpChallenge };

/** Remounted per challenge (see the key below) so a resent code restarts both countdowns and the input. */
function BankOtpBody({ challenge, isSubmitting, isResending, failure, notice, onSubmit, onResend, onBack }: BodyProps) {
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
    <div className="mt-4 space-y-4">
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
          {failure.message}
        </p>
      )}
      {!failure && notice && <p role="status" className="text-sm text-primary">{notice}</p>}
      <BankOtpMeta
        expiryLeft={expiryLeft}
        resendLeft={resendLeft}
        isResending={isResending}
        onResend={onResend}
      />
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onBack}>
          Quay lại
        </Button>
        <Button
          type="button"
          variant="solid"
          isLoading={isSubmitting}
          disabled={code.length !== OTP_LENGTH || isSubmitting || expired}
          onClick={() => onSubmit(code)}
        >
          Xác nhận
        </Button>
      </DialogFooter>
    </div>
  );
}

export function BankOtpDialog({ open, challenge, ...body }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && body.onBack()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận bằng mã OTP</DialogTitle>
          <DialogDescription>
            {challenge ? `Mã ${OTP_LENGTH} số đã được gửi tới ${challenge.maskedRecipient}.` : "Đang gửi mã xác nhận."}
          </DialogDescription>
        </DialogHeader>
        {challenge && <BankOtpBody key={challenge.otpSessionId} challenge={challenge} {...body} />}
      </DialogContent>
    </Dialog>
  );
}
