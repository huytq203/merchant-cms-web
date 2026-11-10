"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { useWithdrawalCreateFlow, type WithdrawalCreateStep, type WithdrawalSubChoice } from "../hooks/use-withdrawal-create-flow";
import type { Withdrawal } from "../types/types";
import { WithdrawalNewStep1 } from "./WithdrawalNewStep1";
import { WithdrawalNewStep2 } from "./WithdrawalNewStep2";
import { WithdrawalOtpStep } from "./WithdrawalOtpStep";
import { WithdrawalSentStep } from "./WithdrawalSentStep";

const STEP_TITLES: Record<Exclude<WithdrawalCreateStep, "sent">, string> = {
  form: "Thông tin rút tiền",
  confirm: "Xem lại yêu cầu",
  otp: "Xác thực OTP",
};
const STEP_NUMBER = { form: 1, confirm: 2, otp: 3 } as const;

type Props = {
  onClose: () => void;
  onViewDetail: (withdrawal: Withdrawal) => void;
  /** Các Sub người dùng được phép rút (đã lọc theo phạm vi gán). */
  subChoices: readonly WithdrawalSubChoice[];
};

/** Mounted only while open, so every opening starts from an empty form and a fresh idempotency key. */
export function WithdrawalCreateModal({ onClose, onViewDetail, subChoices }: Props) {
  const flow = useWithdrawalCreateFlow(subChoices);
  const { step, created } = flow;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size={step === "form" ? "md" : "sm"}>
        {step === "sent" && created ? (
          <WithdrawalSentStep withdrawal={created} onViewDetail={() => onViewDetail(created)} onClose={onClose} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Tạo yêu cầu rút tiền</DialogTitle>
              <DialogDescription>
                Bước {STEP_NUMBER[step === "sent" ? "otp" : step]}/3 · {STEP_TITLES[step === "sent" ? "otp" : step]}
              </DialogDescription>
            </DialogHeader>
            {step === "form" ? <WithdrawalNewStep1 flow={flow} onCancel={onClose} /> : null}
            {step === "confirm" ? <WithdrawalNewStep2 flow={flow} /> : null}
            {step === "otp" ? <WithdrawalOtpStep flow={flow} /> : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
