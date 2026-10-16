import { StatusBadge } from "@/components/page/StatusBadge";
import { Card } from "@/components/ui/card/Card";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDate, formatVnDateTime } from "@/lib/utils/vn-time";
import { HOLD_RANGE_OPTIONS } from "../constants/hold-labels";
import type { HoldCalendar } from "../types";
import { HoldDayTable } from "./HoldDayTable";

function Figure({ label, value, note, accent }: { label: string; value: string; note?: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold tracking-tight tabular-nums ${accent ? "text-primary" : ""}`}>{value}</div>
      {note ? <div className="text-sm text-muted-foreground">{note}</div> : null}
    </div>
  );
}

/** Server-rendered forecast of when a Sub's rule holds become available. */
export function HoldCalendarView({ calendar, today }: { calendar: HoldCalendar; today: string }) {
  const period = HOLD_RANGE_OPTIONS.find((option) => option.value === calendar.range)?.period ?? null;
  return (
    <div className="space-y-4">
      <Card padding="md" role="region" aria-label="Tổng quan tạm giữ" className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        <Figure label="Tổng đang giữ" value={formatAmount(calendar.totalHeld)} />
        <Figure label={period ? `Giải phóng trong ${period}` : "Giải phóng theo lịch"} value={formatAmount(calendar.releasedInPeriod)} accent />
        <Figure label={period ? `Còn giữ sau ${period}` : "Còn giữ sau lịch"} value={formatAmount(calendar.heldAfterPeriod)} />
        <Figure
          label="Ngày giải phóng nhiều nhất"
          value={calendar.peak ? formatVnDate(calendar.peak.date) : "—"}
          note={calendar.peak ? formatAmount(calendar.peak.amount) : undefined}
        />
      </Card>

      <Card padding="none" role="region" aria-labelledby="hold-days" className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 id="hold-days" className="text-base font-semibold">Lịch theo ngày</h2>
          <p className="text-sm text-muted-foreground">Tính lúc {formatVnDateTime(calendar.asOf)}.</p>
        </div>
        <HoldDayTable days={calendar.days} today={today} peakAmount={calendar.peak?.amount ?? 0} />
      </Card>

      <Card padding="md" className="flex flex-wrap gap-x-8 gap-y-4">
        <div className="max-w-xs space-y-1.5">
          <StatusBadge label={calendar.reconciles ? "Khớp sổ cái" : "Lệch sổ cái"} tone={calendar.reconciles ? "success" : "warning"} />
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
