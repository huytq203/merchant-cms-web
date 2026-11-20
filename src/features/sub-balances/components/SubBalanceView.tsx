import Link from "next/link";
import type { ReactNode } from "react";
import { RefreshButton } from "@/components/page/RefreshButton";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { SubBalanceMovementsDialog } from "./SubBalanceMovementsDialog";
import type { BalanceBucket, SubBalanceReport } from "../types";

interface Props {
  report: SubBalanceReport;
  canWithdraw: boolean;
  /** EXPORT_BALANCE: shows "Xuất CSV" in the movements popup. Optional so a caller that does not know it never offers the button. */
  canExport?: boolean;
}

function AmountRow({ label, amount, children }: { label: string; amount: number; children?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border py-3 first:border-t-0">
      <dt className="min-w-0">
        {label}
        {children ? <div className="text-sm text-muted-foreground">{children}</div> : null}
      </dt>
      <dd className="shrink-0 font-semibold tabular-nums">{formatAmount(amount)}</dd>
    </div>
  );
}

function BucketRow({ bucket, link }: { bucket: BalanceBucket; link?: ReactNode }) {
  return (
    <AmountRow label={bucket.label} amount={bucket.amount}>
      {bucket.explanation}
      {link ? <> {link}</> : null}
    </AmountRow>
  );
}

const textLink = "font-semibold text-primary hover:underline";

/** What a Sub can withdraw now, then how its revenue splits and what is held. Server-rendered. */
export function SubBalanceView({ report, canWithdraw, canExport = false }: Props) {
  // Displayed balance per source for the popup subtitle: the thu-chi hộ khác one is net of the Trả sau debt and may be negative.
  const pocketBalances = { WALLET: report.availableWallet?.amount ?? null, OTHER: report.otherDisplayBalance };
  const movementsProps = {
    subMerchantId: report.subMerchantId,
    subCode: report.subCode,
    subName: report.subName,
    availableBalance: report.availableBalance,
    canExport,
    pocketBalances,
  };
  return (
    <div className="space-y-4">
      <Card padding="md" role="region" aria-labelledby="available-balance" className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 id="available-balance" className="text-sm font-semibold text-muted-foreground">Số dư khả dụng</h2>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">{formatAmount(report.availableBalance)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {report.available.explanation} Cập nhật lúc {formatVnDateTime(report.asOf)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshButton />
          {/* The page already requires VIEW_BALANCE, which is the permission the movements endpoints check. */}
          <SubBalanceMovementsDialog {...movementsProps} />
          {canWithdraw ? (
            <Button variant="solid" nativeButton={false} render={<Link href="/withdrawal" role="link" />}>
              Tạo lệnh rút
            </Button>
          ) : null}
        </div>
      </Card>

      {/* GĐ6 (chi hộ): tách số khả dụng theo hai nguồn tiền. Chỉ vẽ khi BE gửi số theo ngăn — thiếu số là "chưa biết", không phải 0. */}
      {report.availableWallet && report.availableOther ? (
        <Card padding="md" role="region" aria-labelledby="pocket-balances">
          <h2 id="pocket-balances" className="mb-1 text-base font-semibold">Số dư theo nguồn tiền</h2>
          <dl>
            {/* Mỗi dòng nguồn mở popup biến động ngay trên nguồn đó (CẦN CHỐT 13 GĐ7). */}
            <BucketRow bucket={report.availableWallet} link={<SubBalanceMovementsDialog {...movementsProps} initialPocket="WALLET" triggerLabel="Xem biến động" />} />
            <BucketRow bucket={report.availableOther} link={<SubBalanceMovementsDialog {...movementsProps} initialPocket="OTHER" triggerLabel="Xem biến động" />} />
            {report.disbursementHold ? <BucketRow bucket={report.disbursementHold} /> : null}
            {report.overdraftDebt ? <BucketRow bucket={report.overdraftDebt} /> : null}
            {/* Khả dụng ngăn khác trừ dư nợ Trả sau: âm khi nợ lớn hơn số có. */}
            {report.otherDisplayBalance !== null ? (
              <AmountRow label="Số dư thu-chi hộ khác hiển thị" amount={report.otherDisplayBalance}>
                Khả dụng của nguồn này trừ dư nợ Trả sau; có thể âm.
              </AmountRow>
            ) : null}
          </dl>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="md" role="region" aria-labelledby="revenue-total">
          <h2 id="revenue-total" className="mb-1 text-base font-semibold">Tổng doanh thu {formatAmount(report.revenueBalance)}</h2>
          <dl>
            <AmountRow label={report.available.label} amount={report.availableBalance} />
            <BucketRow bucket={report.pending} link={<Link href={`/settlement-items?subMerchantId=${report.subMerchantId}`} className={textLink}>Xem dòng quyết toán</Link>} />
            <AmountRow label="Đang đóng băng" amount={report.frozenTotal} />
          </dl>
        </Card>
        <Card padding="md" role="region" aria-labelledby="frozen-total">
          <h2 id="frozen-total" className="mb-1 text-base font-semibold">Đang đóng băng {formatAmount(report.frozenTotal)}</h2>
          <dl>
            <BucketRow bucket={report.ruleHold} link={<Link href={`/hold-calendar?subMerchantId=${report.subMerchantId}`} className={textLink}>Xem lịch giải phóng</Link>} />
            <BucketRow bucket={report.orderFreeze} />
            <BucketRow bucket={report.withdrawalInProcess} />
            <BucketRow bucket={report.waitingEscrow} />
          </dl>
        </Card>
      </div>
    </div>
  );
}
