import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils/cn";
import { TRANCHE_GROUPS } from "../constants/settlement-labels";
import type { SettlementTotals } from "../types";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

/** Một ô số: nhãn nhỏ trên, số lớn dưới; `accent` làm nổi "Doanh thu ghi nhận" — con số kế toán đối chiếu. */
function Tile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-xl border px-4 py-2.5", accent ? "border-brand/50 bg-muted" : "border-border bg-background")}>
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className={cn("truncate text-lg font-bold tabular-nums", accent && "text-primary")}>{value}</p>
    </div>
  );
}

/**
 * Doanh thu ghi nhận đang ở trạng thái nào (mục 11): gộp `byTrancheStatus` của BE theo 4 nhóm của bộ lọc. Tổng các nhóm
 * bằng doanh thu ghi nhận (bất biến BE); phần không thuộc nhóm nào (vd. đợt đã hủy do hoàn tiền) hiện thành "Khác" để thanh
 * vẫn cộng đủ 100%.
 */
function Allocation({ totals }: { totals: SettlementTotals }) {
  const byStatus = totals.byTrancheStatus;
  const groups = TRANCHE_GROUPS.map((group) => ({
    ...group,
    amount: group.statuses.reduce((sum, status) => sum + (byStatus[status] ?? 0), 0),
  }));
  const known = groups.reduce((sum, group) => sum + group.amount, 0);
  const other = Object.values(byStatus).reduce((sum, value) => sum + value, 0) - known;
  const base = totals.recognisedAmount;
  // BE cũ chưa gửi phân bổ: không vẽ thanh rỗng gây hiểu nhầm.
  if (base <= 0 || Object.keys(byStatus).length === 0) return null;
  const segments = [...groups, ...(other > 0 ? [{ value: "OTHER", label: "Khác (đã hủy)", amount: other, bar: "bg-muted-foreground" }] : [])];
  return (
    <div className="space-y-2 rounded-xl bg-muted/60 p-3">
      <p className="text-sm text-muted-foreground">Doanh thu ghi nhận {money(base)} đang ở đâu</p>
      <div className="flex h-3.5 overflow-hidden rounded-full bg-background" aria-hidden="true">
        {segments.filter((segment) => segment.amount > 0).map((segment) => (
          <div key={segment.value} className={segment.bar} style={{ width: `${(segment.amount / base) * 100}%` }} />
        ))}
      </div>
      <ul aria-label="Phân bổ theo trạng thái đợt" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {segments.map((segment) => (
          <li key={segment.value} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", segment.bar)} aria-hidden="true" />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="font-semibold tabular-nums">{money(segment.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Props {
  totals: SettlementTotals;
  /** Có khi đang xem Tất cả Sub: dải "Theo Sub", bấm để lọc. */
  onPickSub?: (subMerchantId: string) => void;
}

/** Thay hai hàng phương trình cũ: 3 ô Gộp / Phí / Doanh thu ghi nhận và thanh phân bổ theo trạng thái đợt. */
export function SettlementTotalsBar({ totals, onPickSub }: Props) {
  const label = `Tổng của ${totals.count} đơn hàng`;
  return (
    <Card role="region" aria-label={label} className="space-y-3">
      <p className="text-sm text-muted-foreground">{label} trong khoảng đã chọn, đơn vị vnđ. Chưa trừ phần hoàn tiền.</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <Tile label={`Giá trị gộp · ${totals.count} đơn`} value={money(totals.grossAmount)} />
        <Tile label="Phí" value={totals.feeAmount > 0 ? `− ${money(totals.feeAmount)}` : "0"} />
        <Tile label="Doanh thu ghi nhận" value={money(totals.recognisedAmount)} accent />
      </div>
      <Allocation totals={totals} />
      {onPickSub && totals.bySub.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Theo Sub:</span>
          {totals.bySub.map((sub) => (
            <button
              key={sub.subMerchantId}
              type="button"
              onClick={() => onPickSub(sub.subMerchantId)}
              aria-label={`Lọc theo ${sub.subMerchantName ?? sub.subMerchantCode ?? "Sub-merchant"}`}
              className="rounded-md border border-border bg-background px-2.5 py-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="font-medium">{sub.subMerchantName ?? sub.subMerchantCode}</span>{" "}
              <span className="tabular-nums text-muted-foreground">{money(sub.recognisedAmount)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
