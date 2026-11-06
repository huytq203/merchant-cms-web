"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Notice } from "@/components/page/Notice";
import { Button } from "@/components/ui/button/Button";
import { formatAmount } from "@/lib/utils/helper";
import { describeWithdrawalError } from "../utils/withdrawal-errors";
import type { WithdrawalBalance } from "../types/types";

type Props = { balance: UseQueryResult<WithdrawalBalance>; hasAccount: boolean; blocker: string | null };

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

/** What one Sub can withdraw now. An unreadable balance is said, never shown as zero. */
export function WithdrawalBalancePanel({ balance, hasAccount, blocker }: Props) {
  if (!hasAccount) {
    return <Notice tone="info">Chọn tài khoản nhận để xem số tiền sẵn sàng rút của Sub-merchant.</Notice>;
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
  return (
    <Frame>
      <dl className="divide-y divide-border">
        <Row label="Số tiền rút (toàn bộ khoản sẵn sàng)" value={formatAmount(data.readyAmount)} strong />
        <Row label="Cấn trừ ký quỹ" value={formatAmount(data.setoff)} />
        <Row label="Phí rút tạm tính" value={formatAmount(data.fee)} />
        <Row label="Thực nhận" value={formatAmount(data.netReceived)} strong />
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
