"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { formatAmount } from "@/lib/utils/helper";
import { cn } from "@/lib/utils/cn";
import type { WithdrawalBalance } from "../types/types";

type Props = { balance: UseQueryResult<WithdrawalBalance>; columns?: 2 | 3 };

function Tile({ label, value, note, primary = false }: { label: string; value: string; note: string; primary?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-4", primary ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
      <p className={cn("text-xs", primary ? "text-primary-foreground/90" : "text-muted-foreground")}>{label}</p>
      <p className="mt-0.5 font-mono text-xl font-bold tabular-nums">{value}</p>
      <p className={cn("mt-0.5 text-xs", primary ? "text-primary-foreground/90" : "text-muted-foreground")}>{note}</p>
    </div>
  );
}

const grid = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" } as const;

/** Available balance, the part held, and what today's limit still allows. An unreadable balance is said, never shown as zero. */
export function WithdrawalBalanceTiles({ balance, columns = 3 }: Props) {
  if (balance.isError) {
    return <p role="status" className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Chưa đọc được số dư ví, vui lòng thử lại sau.</p>;
  }
  const data = balance.data;
  const money = (value: number | null | undefined) => (data && value != null ? formatAmount(value) : "—");
  return (
    <div aria-busy={balance.isPending} className={cn("grid gap-3", grid[columns])}>
      <Tile primary label="Số dư khả dụng" value={money(data?.availableBalance)} note="Có thể rút" />
      {columns === 3 ? (
        <Tile label="Đang giữ" value={money(data?.heldBalance)} note="Dành cho yêu cầu đang xử lý, chưa rút được" />
      ) : null}
      <Tile
        label="Hạn mức rút còn lại hôm nay"
        value={data && data.dailyLimitRemaining === null ? "Không giới hạn" : money(data?.dailyLimitRemaining)}
        note={data?.minimumAmount != null ? `Tối thiểu mỗi lần ${formatAmount(data.minimumAmount)}` : "Theo cấu hình của Flexpay"}
      />
    </div>
  );
}
