import type { ReactNode } from "react";
import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils/cn";
import type { SettlementTotals } from "../types";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

/**
 * Một số hạng của phép tính: nhãn nhỏ nằm trên, số lớn nằm dưới để các số cùng một hàng
 * thẳng nhau dù nhãn dài ngắn khác nhau. `total` làm nổi bật "Doanh thu ghi nhận" vì đó là
 * con số kế toán đối chiếu ở cả hai phép tính.
 */
function Term({ label, value, total = false }: { label: string; value: number; total?: boolean }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border px-4 py-2.5",
        total ? "border-brand/50 bg-muted" : "border-border bg-background"
      )}
    >
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className={cn("truncate text-lg font-bold tabular-nums", total && "text-primary")}>{money(value)}</p>
    </div>
  );
}

function Sign({ children }: { children: string }) {
  return (
    <span className="text-center text-lg font-semibold leading-none text-muted-foreground" aria-hidden="true">
      {children}
    </span>
  );
}

/**
 * Một phép tính gồm 3 số hạng và 2 dấu. Cả hai phép dùng chung lưới 5 cột nên số và dấu
 * thẳng cột giữa hai hàng; dưới `md` thì xếp dọc để không phải cuộn ngang.
 */
function Equation({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-3">
      {children}
    </div>
  );
}

/** The two equations an accountant checks: gross minus fee, then how the revenue splits into tranches. */
export function SettlementTotalsBar({ totals }: { totals: SettlementTotals }) {
  const label = `Tổng của ${totals.count} giao dịch`;
  return (
    <Card role="region" aria-label={label} className="space-y-4">
      <p className="text-sm text-muted-foreground">{label} trong khoảng đã chọn, đơn vị vnđ. Chưa trừ phần hoàn tiền.</p>
      <Equation>
        <Term label="Giá trị gộp" value={totals.grossAmount} />
        <Sign>−</Sign>
        <Term label="Phí" value={totals.feeAmount} />
        <Sign>=</Sign>
        <Term label="Doanh thu ghi nhận" value={totals.recognisedAmount} total />
      </Equation>
      <Equation>
        <Term label="Doanh thu ghi nhận" value={totals.recognisedAmount} total />
        <Sign>=</Sign>
        <Term label="Đợt 1" value={totals.firstTrancheAmount} />
        <Sign>+</Sign>
        <Term label="Đợt tạm giữ" value={totals.heldAmount} />
      </Equation>
    </Card>
  );
}
