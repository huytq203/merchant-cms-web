"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { useWithdrawalCreateFlow } from "../hooks/use-withdrawal-create-flow";
import { WithdrawalNewStep1 } from "./WithdrawalNewStep1";
import { WithdrawalNewStep2 } from "./WithdrawalNewStep2";

const STEP_TITLES = { 1: "Thông tin rút tiền", 2: "Xem lại và gửi yêu cầu" } as const;

type Props = { onClose: () => void };

/** Mounted only while open, so every opening starts from an empty form and a fresh idempotency key. */
export function WithdrawalCreateModal({ onClose }: Props) {
  const flow = useWithdrawalCreateFlow(onClose);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu rút tiền</DialogTitle>
          <DialogDescription>
            Bước {flow.step}/2 · {STEP_TITLES[flow.step]}
          </DialogDescription>
        </DialogHeader>
        {flow.step === 1 ? <WithdrawalNewStep1 flow={flow} onCancel={onClose} /> : <WithdrawalNewStep2 flow={flow} />}
      </DialogContent>
    </Dialog>
  );
}
