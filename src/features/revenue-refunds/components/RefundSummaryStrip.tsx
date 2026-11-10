"use client";

import { cn } from "@/lib/utils/cn";
import { formatAmount } from "@/lib/utils/helper";
import { REFUND_GROUPS } from "../constants/refund-status";
import type { RefundGroup, RefundSummary } from "../types";

interface Props {
  summary: RefundSummary | undefined;
  /** Nhóm đang lọc; bấm lại đúng nhóm đó thì bỏ lọc. */
  selected?: RefundGroup;
  onSelect: (group: RefundGroup | undefined) => void;
}

const COUNT_OF: Record<RefundGroup, (summary: RefundSummary) => number> = {
  PENDING: (summary) => summary.pending,
  PROCESSING: (summary) => summary.processing,
  SUCCEEDED: (summary) => summary.succeeded,
  FAILED: (summary) => summary.failed,
};

const GROUPS = Object.keys(REFUND_GROUPS) as RefundGroup[];

/**
 * Dải đếm theo nhóm trạng thái (cùng bộ lọc kỳ/tìm/Sub với danh sách) kèm tổng tiền hoàn THÀNH CÔNG. Mỗi nhóm là một nút
 * lọc nhanh danh sách; ô tiền chỉ để xem, vì tổng tiền không phải trạng thái.
 */
export function RefundSummaryStrip({ summary, selected, onSelect }: Props) {
  return (
    <section aria-label="Tổng quan hoàn tiền" className="grid grid-cols-2 gap-3 @container md:grid-cols-5">
      {GROUPS.map((group) => {
        const active = selected === group;
        return (
          <button
            key={group}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? undefined : group)}
            className={cn(
              "rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-primary ring-1 ring-primary" : "border-border",
            )}
          >
            <span className="block text-sm text-muted-foreground">{REFUND_GROUPS[group].label}</span>
            <span className="block text-2xl font-bold tabular-nums text-foreground" data-testid={`refund-count-${group}`}>
              {summary ? COUNT_OF[group](summary) : "—"}
            </span>
          </button>
        );
      })}
      <div className="col-span-2 rounded-xl border border-border bg-card p-3 md:col-span-1">
        <span className="block text-sm text-muted-foreground">Tổng tiền hoàn thành công</span>
        <span className="block text-2xl font-bold tabular-nums text-foreground" data-testid="refund-succeeded-amount">
          {summary ? formatAmount(summary.succeededAmount) : "—"}
        </span>
      </div>
    </section>
  );
}
