import Link from "next/link";
import type { ReactNode } from "react";
import { Notice } from "@/components/page/Notice";
import { RefreshButton } from "@/components/page/RefreshButton";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { formatAmount } from "@/lib/utils/helper";
import type { DisbursementOverview as Overview } from "../types/types";
import { availableModes, balanceSummary } from "../utils/disbursement-mapper";

type Props = { overview: Overview; canCreate: boolean };

const amountOrDash = (value: number | null | undefined) => (value === null || value === undefined ? "Không giới hạn" : formatAmount(value));

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border py-2.5 first:border-t-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}

const CHANNEL_LABELS: Record<string, string> = { SINGLE: "Đơn lẻ", BATCH: "Theo lô", API: "Qua API" };

/**
 * Tổng quan chi hộ của một Sub: số dư thu-chi hộ (Trả sau có thể âm), cấu hình dịch vụ Admin đã thiết lập (Portal chỉ xem),
 * hạn mức và ngưỡng tự duyệt. Nút tạo lệnh chỉ hiện khi có quyền tạo và Sub bật chi đơn lẻ hoặc theo lô.
 */
export function DisbursementOverview({ overview, canCreate }: Props) {
  const { service } = overview;
  if (!service.disbursementEnabled) {
    return (
      <Card padding="md" role="region" aria-label="Dịch vụ Chi hộ">
        <p className="text-sm">Sub-merchant này chưa bật dịch vụ Chi hộ.</p>
        <p className="mt-1 text-sm text-muted-foreground">Liên hệ Flexpay để được bật dịch vụ.</p>
      </Card>
    );
  }
  const modes = availableModes(service);
  const balance = balanceSummary(overview);
  const limits = overview.limits;
  const postfunded = overview.fundingMode === "POSTFUNDED";
  const subQuery = `subMerchantId=${overview.subId}`;
  return (
    <div className="space-y-4">
      <Card padding="md" role="region" aria-labelledby="disbursement-balance" className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 id="disbursement-balance" className="sr-only">Số dư thu-chi hộ</h2>
          <p className="text-sm font-semibold text-muted-foreground">Số dư thu-chi hộ</p>
          <p className={`mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl ${balance.negative ? "text-danger" : ""}`}>{balance.text}</p>
          <p className="mt-1 text-sm text-muted-foreground">{balance.caption}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshButton />
          {/* Lịch sử lệnh và lô của Sub đang xem (GĐ5 Task 5.15); chỉ cần VIEW_DISBURSEMENT như chính màn này. */}
          <Button variant="outline" nativeButton={false} render={<Link href={`/disbursements/orders?subMerchantIds=${overview.subId}`} role="link" />}>Lịch sử chi hộ</Button>
          <Button variant="outline" nativeButton={false} render={<Link href={`/disbursements/batches?subId=${overview.subId}`} role="link" />}>Lô chi hộ</Button>
          {service.disbursementTopupEnabled ? (
            <Button variant="outline" nativeButton={false} render={<Link href={`/disbursements/topups?${subQuery}`} role="link" />}>Nạp tiền</Button>
          ) : null}
          {canCreate && (modes.single || modes.batch) ? (
            <Button variant="solid" nativeButton={false} render={<Link href={`/disbursements/new?${subQuery}`} role="link" />}>Tạo lệnh chi hộ</Button>
          ) : null}
        </div>
      </Card>
      {!modes.single && !modes.batch ? (
        <Notice tone="info">Sub-merchant chưa bật Chi hộ đơn lẻ hoặc theo lô trên Portal. Chi hộ chỉ gọi được qua API.</Notice>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="md" role="region" aria-labelledby="disbursement-config">
          <h2 id="disbursement-config" className="mb-1 text-base font-semibold">Cấu hình dịch vụ</h2>
          <dl className="text-sm">
            <Row label="Hình thức chi hộ">{service.channels.map((channel) => CHANNEL_LABELS[channel] ?? channel).join(", ") || "—"}</Row>
            <Row label="Hình thức cấp vốn">{postfunded ? "Trả sau" : "Trả trước"}</Row>
            {postfunded ? <Row label="Hạn mức Trả sau">{amountOrDash(overview.creditLimit)}</Row> : null}
            {postfunded && overview.balance ? <Row label="Hạn mức Trả sau còn lại">{amountOrDash(overview.balance.creditLimitRemaining)}</Row> : null}
            <Row label="Ngưỡng tự duyệt">{overview.autoApproveThreshold === null || overview.autoApproveThreshold === undefined ? "Mọi lệnh chờ duyệt" : `Đến ${formatAmount(overview.autoApproveThreshold)}`}</Row>
          </dl>
        </Card>
        <Card padding="md" role="region" aria-labelledby="disbursement-limits">
          <h2 id="disbursement-limits" className="mb-1 text-base font-semibold">Hạn mức</h2>
          <dl className="text-sm">
            <Row label="Tối thiểu mỗi giao dịch">{limits?.perTxnMin === null || limits?.perTxnMin === undefined ? "Không giới hạn" : formatAmount(limits.perTxnMin)}</Row>
            <Row label="Tối đa mỗi giao dịch">{amountOrDash(limits?.perTxnMax)}</Row>
            <Row label="Hạn mức trong ngày">{amountOrDash(limits?.dailyAmount)}</Row>
            <Row label="Hạn mức trong tháng">{amountOrDash(limits?.monthlyAmount)}</Row>
          </dl>
        </Card>
      </div>
    </div>
  );
}
