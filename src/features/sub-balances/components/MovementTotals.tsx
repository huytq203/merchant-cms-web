import { cn } from "@/lib/utils/cn";
import { formatAmount } from "@/lib/utils/helper";
import type { MovementSummary } from "../movement-types";
import { amountToneClass, formatSignedAmount } from "../utils/movement-format";

/** Said in place of a total the BE could not add up (too many movements, or the pages did not reconcile). */
const TOO_LONG = "Chưa cộng được, thu hẹp kỳ để xem";

/** In and out are gross: an amount held and given back is counted on both sides. */
const GROSS_NOTE = "Tổng gộp, gồm cả khoản giữ rồi trả lại (lệnh rút bị từ chối, gỡ đóng băng).";

function Cell({ label, value, tone }: { label: string; value: string | null; tone?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {value === null ? (
        <p className="text-xs text-muted-foreground">{TOO_LONG}</p>
      ) : (
        <p className={cn("break-words font-semibold tabular-nums", tone)}>{value}</p>
      )}
    </div>
  );
}

/**
 * The four totals of the chosen period: opening balance, money in, money out, closing balance. They cover every type
 * (not the chip), so opening + in − out = closing always holds; credits use the success color like the rows.
 */
export function MovementTotals({ summary }: { summary: MovementSummary }) {
  return (
    <div role="group" aria-label="Tổng kỳ">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Cell label="Đầu kỳ" value={formatAmount(summary.openingBalance)} />
      <Cell label="Tổng cộng vào" value={summary.totalIn === null ? null : formatSignedAmount(summary.totalIn)}
        tone={summary.totalIn === null ? undefined : amountToneClass(summary.totalIn)} />
      <Cell label="Tổng trừ ra" value={summary.totalOut === null ? null : formatSignedAmount(-summary.totalOut)} />
      <Cell label="Cuối kỳ" value={formatAmount(summary.closingBalance)} />
      </div>
      {/* In/out are gross sums, so a hold that came back shows on both sides; say it so the totals are not misread. */}
      <p className="mt-1 text-xs text-muted-foreground">{GROSS_NOTE}</p>
    </div>
  );
}
