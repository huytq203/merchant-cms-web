"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { OtpEntry } from "@/components/form/OtpEntry";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { BANK_OPTIONS } from "@/features/bank-accounts/constants/bank-options";
import { formatAmount } from "@/lib/utils/helper";
import { useRefundCreateFlow, type RefundCreateFlow } from "../hooks/use-refund-create-flow";
import { RefundCreateFields } from "./RefundCreateFields";

export interface RefundOrder {
  id: string;
  orderCode: string;
  amount: number;
  subMerchantName?: string | null;
}

interface Props {
  order: RefundOrder;
  onClose: () => void;
}

const TITLES = { form: "Tạo yêu cầu hoàn tiền", otp: "Xác nhận và nhập OTP", done: "Đã tạo yêu cầu hoàn tiền" } as const;
const STEP = { form: 1, otp: 2, done: 3 } as const;

function Summary({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl bg-secondary p-4 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function OtpStep({ flow, subName }: { flow: RefundCreateFlow; subName: string }) {
  const { draft, otp } = flow;
  if (!draft || !otp.challenge) return null;
  const bank = BANK_OPTIONS.find((option) => option.value === draft.beneficiaryBankCode)?.label ?? draft.beneficiaryBankCode;
  return (
    <DialogBody className="space-y-4">
      <Summary rows={[
        ["Số tiền hoàn", formatAmount(draft.amount)],
        ["Trừ vào", `Số dư khả dụng của ${subName}`],
        ["Người nhận", draft.beneficiaryAccountName],
        ["Tài khoản", `${bank} ${draft.beneficiaryAccountNumber}`],
      ]} />
      <p className="text-sm text-muted-foreground">{`Nhập mã 6 số đã gửi tới ${otp.challenge.maskedRecipient}. Đổi số tiền thì cần mã mới.`}</p>
      <OtpEntry
        key={otp.challenge.otpSessionId}
        challenge={otp.challenge}
        isSubmitting={flow.isSubmitting}
        isResending={otp.isRequesting}
        failure={otp.failure}
        notice={null}
        submitLabel="Tạo yêu cầu"
        backLabel="Sửa thông tin"
        onSubmit={(code) => void flow.submit(code)}
        onResend={() => void otp.resend()}
        onBack={flow.back}
      />
    </DialogBody>
  );
}

/** Mounted only while open, so each opening starts from an empty form. */
export function RefundCreateDialog({ order, onClose }: Props) {
  const flow = useRefundCreateFlow(order);
  const subName = order.subMerchantName || "Sub-merchant";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size={flow.step === "form" ? "md" : "sm"}>
        <DialogHeader>
          <DialogTitle>{TITLES[flow.step]}</DialogTitle>
          <DialogDescription>{`Giao dịch ${order.orderCode}, bước ${STEP[flow.step]}/3`}</DialogDescription>
        </DialogHeader>
        {flow.step === "form" ? (
          <>
            <DialogBody className="space-y-4">
              <RefundCreateFields flow={flow} orderAmount={order.amount} subMerchantName={subName} />
              {flow.otp.failure ? <p role="alert" className="text-sm text-danger">{flow.otp.failure}</p> : null}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
              <Button type="button" variant="solid" isLoading={flow.otp.isRequesting} onClick={() => void flow.review()}>Tiếp tục</Button>
            </DialogFooter>
          </>
        ) : null}
        {flow.step === "otp" ? <OtpStep flow={flow} subName={subName} /> : null}
        {flow.step === "done" && flow.created ? (
          <>
            <DialogBody className="grid justify-items-center gap-3 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success"><Check size={26} aria-hidden="true" /></span>
              <p className="font-semibold">Yêu cầu đang chờ người có quyền phê duyệt.</p>
              <Summary rows={[["Mã yêu cầu", flow.created.refundCode], ["Số tiền hoàn", formatAmount(flow.created.amount)], ["Trạng thái", "Chờ phê duyệt"]]} />
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" nativeButton={false} render={<Link href={`/revenue-refunds?orderId=${order.id}`} role="link" />}>Xem trong danh sách</Button>
              <Button type="button" variant="solid" onClick={onClose}>Đóng</Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
