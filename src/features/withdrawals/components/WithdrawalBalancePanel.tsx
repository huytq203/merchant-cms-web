"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Notice } from "@/components/page/Notice";
import { Button } from "@/components/ui/button/Button";
import { formatAmount } from "@/lib/utils/helper";
import { describeWithdrawalError, withdrawalFailureKind } from "../utils/withdrawal-errors";
import type { WithdrawalBalance } from "../types/types";

type Props = { balance: UseQueryResult<WithdrawalBalance>; hasSub: boolean; blocker: string | null };

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-mono text-lg font-bold tabular-nums" : "font-mono tabular-nums"}>{value}</dd>
    </div>
  );
}

function Frame({ children, busy = false }: { children: ReactNode; busy?: boolean }) {
  return (
    <section aria-label="Số tiền sẵn sàng rút" aria-busy={busy} className="space-y-2 rounded-xl border border-border bg-card p-4">
      {children}
    </section>
  );
}

/** Phí/thực nhận chưa tính được vì chưa có TK nhận (11/11): nói rõ đang chờ, không hiện 0. */
const AWAITING_ACCOUNT = "Chờ chọn tài khoản";
/** BE cũ trả cả màn 409 5736 khi chưa có TK: không có số nào để hiện, chỉ nhắc chọn TK (không phải lỗi để thử lại). */
const CHOOSE_ACCOUNT_FIRST = "Chọn tài khoản nhận tiền để xem số tiền rút, phí rút và số tiền thực nhận";

/** What one Sub can withdraw now. An unreadable balance is said, never shown as zero. */
export function WithdrawalBalancePanel({ balance, hasSub, blocker }: Props) {
  if (!hasSub) {
    return <Notice tone="info">Chọn Sub-merchant để xem số tiền sẵn sàng rút.</Notice>;
  }
  if (balance.isError && withdrawalFailureKind(balance.error) === "bankAccountRequired") {
    return <Notice tone="info">{CHOOSE_ACCOUNT_FIRST}</Notice>;
  }
  if (balance.isError) {
    return (
      <Frame>
        <p role="alert" className="text-sm text-danger">{describeWithdrawalError(balance.error)}</p>
        <Button type="button" variant="outline" size="sm" isLoading={balance.isFetching} onClick={() => void balance.refetch()}>
          Thử lại
        </Button>
      </Frame>
    );
  }
  const data = balance.data;
  if (!data) return <Frame busy><p className="text-sm text-muted-foreground">Đang tải số dư...</p></Frame>;
  // Only when the escrow is actually short: a Sub without set-off never sees escrow rows.
  const showShortfall = (data.escrowShortfallBefore ?? 0) > 0;
  return (
    <Frame>
      <dl className="divide-y divide-border">
        <Row label="Số tiền rút (toàn bộ khoản sẵn sàng)" value={formatAmount(data.readyAmount)} strong />
        {/* Ký quỹ Master đang thiếu: cấn trừ = min(số rút, phần thiếu); phần thiếu còn lại cấn ở lần rút sau. */}
        {showShortfall ? <Row label="Ký quỹ còn thiếu trước khi rút" value={formatAmount(data.escrowShortfallBefore ?? 0)} /> : null}
        <Row label="Cấn trừ ký quỹ" value={formatAmount(data.setoff)} />
        <Row label="Phí rút tạm tính" value={data.fee === null ? AWAITING_ACCOUNT : formatAmount(data.fee)} />
        <Row
          label="Thực nhận"
          value={data.netReceived === null ? AWAITING_ACCOUNT : formatAmount(Math.max(0, data.netReceived))}
          strong
        />
        {showShortfall ? <Row label="Ký quỹ còn thiếu sau lệnh này" value={formatAmount(data.escrowShortfallAfter ?? 0)} /> : null}
      </dl>
      <dl className="divide-y divide-border border-t border-border pt-1 text-muted-foreground">
        <Row label="Số dư khả dụng" value={formatAmount(data.availableBalance)} />
        <Row label="Đang giữ" value={formatAmount(data.heldBalance)} />
        <Row label="Chờ quyết toán" value={formatAmount(data.pendingSettlement)} />
        <Row
          label="Hạn mức rút còn lại hôm nay"
          value={data.dailyLimitRemaining === null ? "Không giới hạn" : formatAmount(data.dailyLimitRemaining)}
        />
      </dl>
      {blocker ? <Notice tone="warning">{blocker}</Notice> : null}
    </Frame>
  );
}
