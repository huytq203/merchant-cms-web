"use client";

import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { formatAmount } from "@/lib/utils/helper";
import type { RefundCancel } from "../hooks/use-refund-cancel";

/** Xác nhận hủy ngay trong trang; hủy không chuyển tiền nên không cần OTP. */
export function RefundCancelDialog({ cancel }: { cancel: RefundCancel }) {
  const { target } = cancel;
  if (!target) return null;

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && cancel.close()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Hủy yêu cầu hoàn tiền</DialogTitle>
          <DialogDescription>{target.refundCode}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <p className="text-sm">
            {`Hủy yêu cầu hoàn ${formatAmount(target.amount)} cho đơn hàng ${target.orderCode ?? ""}? Yêu cầu chuyển sang Đã hủy, không trừ tiền và không thể mở lại; muốn hoàn tiếp phải tạo yêu cầu mới.`}
          </p>
          {cancel.failure ? <p role="alert" className="text-sm text-danger">{cancel.failure}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={cancel.isCancelling} onClick={cancel.close}>Giữ lại</Button>
          <Button type="button" variant="solid" isLoading={cancel.isCancelling} onClick={() => void cancel.confirm()}>Hủy yêu cầu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
