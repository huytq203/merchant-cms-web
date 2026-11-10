import { StatusBadge } from "@/components/page/StatusBadge";
import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils/cn";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDate, formatVnDateTime, shiftVnDate } from "@/lib/utils/vn-time";
import { HOLD_RANGE_OPTIONS, ledgerReconcileStatus } from "../constants/hold-labels";
import type { HoldCalendar } from "../types";
import { HoldReleaseBoard } from "./HoldReleaseBoard";

function Figure({ label, value, note, accent }: { label: string; value: string; note?: string; accent?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-xl border px-4 py-3", accent ? "border-brand/50 bg-muted" : "border-border bg-background")}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-bold tracking-tight tabular-nums", accent && "text-primary")}>{value}</div>
      {note ? <div className="text-sm text-muted-foreground">{note}</div> : null}
    </div>
  );
}

/**
 * Bốn ô của mục 14: Đang giữ, Giải phóng 7 ngày tới (cộng các ngày của lịch tới hôm nay + 6), Đã giải phóng và Hủy do hoàn
 * tiền trong cửa sổ nhìn lùi cùng kỳ (BE tính). Ô "Còn giữ sau kỳ" cũ bị bỏ: với quy tắc giữ ngắn hơn kỳ nó luôn bằng 0.
 */
export function HoldCalendarView({ calendar, today, subMerchantId }: { calendar: HoldCalendar; today: string; subMerchantId?: string }) {
  const period = HOLD_RANGE_OPTIONS.find((option) => option.value === calendar.range)?.period ?? null;
  const weekEnd = shiftVnDate(today, 6);
  const nextWeek = calendar.days.filter((day) => day.date <= weekEnd);
  const nextWeekAmount = nextWeek.reduce((sum, day) => sum + day.amount, 0);
  // Số khoản chỉ đếm được khi mọi khoản đang giữ đều nằm trong kỳ (các ngày ngoài kỳ không được BE trả).
  const heldCount = calendar.heldAfterPeriod === 0 ? calendar.days.reduce((sum, day) => sum + day.count, 0) : null;
  const pastLabel = period ? `${period} qua` : "từ trước tới nay";
  return (
    <div className="space-y-4">
      <div role="region" aria-label="Tổng quan tạm giữ" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Figure label="Đang giữ" value={formatAmount(calendar.totalHeld)} note={heldCount !== null ? `${heldCount} khoản` : undefined} accent />
        <Figure
          label="Giải phóng 7 ngày tới"
          value={formatAmount(nextWeekAmount)}
          note={nextWeek[0] ? `gần nhất ${formatVnDate(nextWeek[0].date).slice(0, 5)}` : undefined}
        />
        <Figure
          label={`Đã giải phóng ${pastLabel}`}
          value={calendar.releasedInPast ? formatAmount(calendar.releasedInPast.amount) : "—"}
          note={calendar.releasedInPast ? `${calendar.releasedInPast.count} khoản` : undefined}
        />
        <Figure
          label="Hủy do hoàn tiền"
          value={calendar.cancelledByRefund ? formatAmount(calendar.cancelledByRefund.amount) : "—"}
          note={calendar.cancelledByRefund ? `${calendar.cancelledByRefund.count} khoản · ${pastLabel}` : undefined}
        />
      </div>

      <Card role="region" aria-labelledby="hold-items" className="space-y-2 overflow-hidden">
        <p className="text-sm text-muted-foreground">Tính lúc {formatVnDateTime(calendar.asOf)}.</p>
        <HoldReleaseBoard calendar={calendar} today={today} subMerchantId={subMerchantId} />
      </Card>

      <Card padding="md" className="flex flex-wrap gap-x-8 gap-y-4">
        <div className="max-w-xs space-y-1.5">
          <StatusBadge {...ledgerReconcileStatus(calendar)} />
          {calendar.ledgerHeld === null ? null : (
            <p className="text-sm text-muted-foreground">Số dư tạm giữ theo quy tắc trên sổ cái: {formatAmount(calendar.ledgerHeld)}.</p>
          )}
        </div>
        <ul className="min-w-0 flex-1 basis-80 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {calendar.notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      </Card>
    </div>
  );
}
