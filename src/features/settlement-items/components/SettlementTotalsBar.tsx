import { Card } from "@/components/ui/card/Card";
import type { SettlementTotals } from "../types";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

function Term({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-bold tabular-nums">{money(value)}</span>
    </span>
  );
}

function Sign({ children }: { children: string }) {
  return <span className="text-muted-foreground" aria-hidden="true">{children}</span>;
}

/** The two equations an accountant checks: gross minus fee, then how the revenue splits into tranches. */
export function SettlementTotalsBar({ totals }: { totals: SettlementTotals }) {
  const label = `Tổng của ${totals.count} giao dịch`;
  return (
    <Card role="region" aria-label={label} className="space-y-3">
      <p className="text-sm text-muted-foreground">{label} trong khoảng đã chọn, đơn vị vnđ. Chưa trừ phần hoàn tiền.</p>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Term label="Giá trị gộp" value={totals.grossAmount} /><Sign>−</Sign>
        <Term label="Phí" value={totals.feeAmount} /><Sign>=</Sign>
        <Term label="Doanh thu ghi nhận" value={totals.recognisedAmount} />
      </p>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Term label="Doanh thu ghi nhận" value={totals.recognisedAmount} /><Sign>=</Sign>
        <Term label="Đợt 1" value={totals.firstTrancheAmount} /><Sign>+</Sign>
        <Term label="Đợt tạm giữ" value={totals.heldAmount} />
      </p>
    </Card>
  );
}
