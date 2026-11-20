"use client";

import { Notice } from "@/components/page/Notice";
import { Button } from "@/components/ui/button/Button";
import { formatAmount } from "@/lib/utils/helper";
import type { DisbursementCreateFlow } from "../hooks/use-disbursement-create-flow";
import { parseAmountInput } from "../utils/disbursement-mapper";
import { UnconfirmedOrderNotice } from "./UnconfirmedOrderNotice";

const money = (value: number | null | undefined) => (value === null || value === undefined ? "—" : formatAmount(value));

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border py-2.5 first:border-t-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-semibold tabular-nums" : "tabular-nums"}>{value}</dd>
    </div>
  );
}

/**
 * Bước xem lại: người nhận đã tra tên, phí ước tính của Merchant, số trừ số dư, thực nhận, số dư/hạn mức còn lại sau
 * lệnh và lệnh có tự duyệt không. Số chốt do hệ thống chi tính lúc nhận lệnh nên có chú thích "ước tính".
 */
export function DisbursementPreviewPanel({ flow }: { flow: DisbursementCreateFlow }) {
  const { preview, values, inquiry, blockReason } = flow;
  if (!preview) return null;
  const holder = inquiry?.bankAccountName ?? values.accountName;
  return (
    <div className="space-y-4">
      {flow.outcomeUnknown ? (
        <UnconfirmedOrderNotice onLookup={() => void flow.checkExisting()} isLookingUp={flow.isLookingUp} canAbandon={flow.canAbandon} onAbandon={flow.abandonUnconfirmed} />
      ) : null}
      <dl aria-label="Người nhận" className="rounded-xl border border-border bg-card p-4 text-sm">
        <Row label="Ngân hàng" value={values.bankCode} />
        <Row label="Số tài khoản" value={values.accountNumber} />
        <Row label="Chủ tài khoản" value={holder || "—"} />
        <Row label="Mã yêu cầu" value={values.merchantRequestCode} />
      </dl>
      <dl aria-label="Số tiền" className="rounded-xl border border-border bg-card p-4 text-sm">
        <Row label="Số tiền chi" value={money(parseAmountInput(values.amount))} strong />
        <Row label="Phí Merchant" value={money(preview.merchantFee)} />
        <Row label="Phí người nhận" value={money(preview.receiverFee)} />
        <Row label="Trừ số dư thu-chi hộ" value={money(preview.debitAmount)} strong />
        <Row label="Người nhận thực nhận" value={money(preview.payoutAmount)} />
        <Row label="Số dư sau lệnh" value={money(preview.balanceAfter)} />
        {preview.creditLimitRemainingAfter !== null && preview.creditLimitRemainingAfter !== undefined ? (
          <Row label="Hạn mức Trả sau còn lại" value={money(preview.creditLimitRemainingAfter)} />
        ) : null}
      </dl>
      <p className="text-sm text-muted-foreground">
        {preview.autoApprove
          ? "Lệnh nằm trong ngưỡng tự duyệt: hệ thống gửi chi ngay sau khi xác nhận OTP."
          : "Lệnh vượt ngưỡng tự duyệt: sau khi xác nhận OTP, lệnh chờ Admin duyệt rồi mới chi."}
        {preview.estimate ? " Các số trên là ước tính, số chốt do hệ thống chi tính khi nhận lệnh." : ""}
      </p>
      {flow.failure ? <Notice tone="danger">{flow.failure}</Notice> : null}
      {blockReason && !flow.failure ? <Notice tone="warning">{blockReason}</Notice> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={flow.back}>Quay lại</Button>
        <Button type="button" variant="solid" disabled={Boolean(blockReason)} isLoading={flow.isRequestingCode} onClick={() => void flow.sendCode()}>
          Gửi mã OTP
        </Button>
      </div>
    </div>
  );
}
