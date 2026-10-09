"use client";

import { OtpEntry } from "@/components/form/OtpEntry";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
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

export function BankOtpDialog({ open, challenge, failure, ...body }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && body.onBack()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận bằng mã OTP</DialogTitle>
          <DialogDescription>
            {challenge ? `Mã ${OTP_LENGTH} số đã được gửi tới email ${challenge.maskedRecipient}.` : "Đang gửi mã xác nhận."}
          </DialogDescription>
        </DialogHeader>
        {challenge && (
          <div className="mt-4">
            <OtpEntry key={challenge.otpSessionId} challenge={challenge} failure={failure?.message ?? null} {...body} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
