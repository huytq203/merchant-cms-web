"use client";

import { OtpEntry } from "@/components/form/OtpEntry";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { formatAmount } from "@/lib/utils/helper";
import type { RefundApproval } from "../hooks/use-refund-approval";

interface Props {
  approval: RefundApproval;
  subNames: Record<string, string>;
}

/** Says where the money leaves from before asking for the code; approval cannot be undone from the portal. */
export function RefundApproveDialog({ approval, subNames }: Props) {
  const { target, otp } = approval;
  if (!target) return null;
  const subName = subNames[target.subMerchantId] ?? "Sub-merchant";

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && approval.close()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Phê duyệt hoàn tiền</DialogTitle>
          <DialogDescription>{target.refundCode}</DialogDescription>
        </DialogHeader>
        {otp.challenge ? (
          <DialogBody className="space-y-3">
            <p className="text-sm text-muted-foreground">{`Nhập mã 6 số đã gửi tới ${otp.challenge.maskedRecipient}.`}</p>
            <OtpEntry
              key={otp.challenge.otpSessionId}
              challenge={otp.challenge}
              isSubmitting={approval.isApproving}
              isResending={otp.isRequesting}
              failure={otp.failure}
              notice={null}
              submitLabel="Phê duyệt"
              backLabel="Quay lại"
              onSubmit={(code) => void approval.approve(code)}
              onResend={() => void otp.resend()}
              onBack={approval.backToReview}
            />
          </DialogBody>
        ) : (
          <>
            <DialogBody className="space-y-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Số tiền hoàn</dt>
                <dd className="text-right font-semibold tabular-nums">{formatAmount(target.amount)} ({target.fullRefund ? "toàn phần" : "một phần"})</dd>
                <dt className="text-muted-foreground">Trừ vào</dt>
                <dd className="text-right font-semibold">Số dư khả dụng của {subName}</dd>
                <dt className="text-muted-foreground">Lý do</dt>
                <dd className="text-right">{target.reason}</dd>
              </dl>
              <p className="text-sm text-muted-foreground">Sau khi duyệt, yêu cầu chuyển sang Đang xử lý. Kế toán Flexpay chuyển tiền cho khách sau khi sổ cái ghi nhận.</p>
              {otp.failure ? <p role="alert" className="text-sm text-danger">{otp.failure}</p> : null}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={approval.close}>Hủy</Button>
              <Button type="button" variant="solid" isLoading={otp.isRequesting} onClick={() => void approval.sendCode()}>Gửi mã OTP</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
