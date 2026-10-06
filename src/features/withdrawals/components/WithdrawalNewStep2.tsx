"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button/Button";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import { formatAmount } from "@/lib/utils/helper";
import { EMPTY_VALUE } from "../constants/Withdrawal.constants";
import type { WithdrawalCreateFlow } from "../hooks/use-withdrawal-create-flow";

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

/** Step 2: read the request back, then send it. A rejected send keeps everything entered in step 1. */
export function WithdrawalNewStep2({ flow }: { flow: WithdrawalCreateFlow }) {
  const { values, selectedBank, selectedSubMerchant, submitError, isSubmitting } = flow;
  const bankText = selectedBank
    ? `${bankDisplayName(selectedBank.bankCode)} ${selectedBank.accountNumberMasked}`
    : EMPTY_VALUE;

  return (
    <div className="mt-4 space-y-4">
      <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 text-sm">
        <Field label="Sub-merchant">
          {selectedSubMerchant ? `${selectedSubMerchant.code} — ${selectedSubMerchant.name}` : "Toàn merchant"}
        </Field>
        <Field label="Tài khoản nhận">{bankText}</Field>
        <Field label="Chủ tài khoản">{selectedBank?.accountName ?? EMPTY_VALUE}</Field>
        <Field label="Số tiền rút">{formatAmount(Number(values.amount))}</Field>
        <Field label="Ghi chú" wide>
          {values.reason.trim() || EMPTY_VALUE}
        </Field>
      </dl>
      <p className="text-sm text-muted-foreground">
        Phí rút tiền do hệ thống tính khi tạo yêu cầu và cộng thêm vào số tiền rút.
        Yêu cầu ở trạng thái Chờ duyệt cho đến khi được phê duyệt.
      </p>
      {submitError && (
        <p role="alert" className="text-sm text-danger">
          {submitError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={flow.back} disabled={isSubmitting}>
          Quay lại
        </Button>
        <Button type="button" variant="solid" isLoading={isSubmitting} onClick={() => void flow.submit()}>
          Gửi yêu cầu
        </Button>
      </div>
    </div>
  );
}
