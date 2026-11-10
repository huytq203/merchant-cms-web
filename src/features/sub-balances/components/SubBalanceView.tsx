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
export function SubBalanceView({ report, canWithdraw }: Props) {
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
          <SubBalanceMovementsDialog
            subMerchantId={report.subMerchantId}
            subCode={report.subCode}
            subName={report.subName}
            availableBalance={report.availableBalance}
          />
          {canWithdraw ? (
            <Button variant="solid" nativeButton={false} render={<Link href="/withdrawal" role="link" />}>
              Tạo lệnh rút
            </Button>
          ) : null}
        </div>
      </Card>

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
