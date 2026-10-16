import { RefreshButton } from "@/components/page/RefreshButton";
import { StatusBadge } from "@/components/page/StatusBadge";
import { Card } from "@/components/ui/card/Card";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDate } from "@/lib/utils/vn-time";
import { ESCROW_STATE } from "../constants/escrow-labels";
import type { EscrowStanding } from "../types";

function Figure({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "warning" | "primary" }) {
  const color = tone === "warning" ? "text-warning" : tone === "primary" ? "text-primary" : "";
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold tracking-tight tabular-nums ${color}`}>{value}</div>
      {note ? <div className="text-sm text-muted-foreground">{note}</div> : null}
    </div>
  );
}

function deadlineText(standing: EscrowStanding): string | null {
  if (!standing.deadlineAt || standing.state !== "SHORT") return null;
  const date = formatVnDate(standing.deadlineAt);
  if (standing.overdue) return `Đã quá hạn nộp đủ (${date}).`;
  return standing.daysLeft === null ? `Hạn nộp đủ ${date}.` : `Hạn nộp đủ ${date}, còn ${standing.daysLeft} ngày.`;
}

function Figures({ standing }: { standing: EscrowStanding }) {
  if (standing.state === "UNKNOWN" || standing.balance === null) {
    return (
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Figure label="Mức yêu cầu" value={formatAmount(standing.requiredAmount)} />
        <p role="alert" className="text-sm text-muted-foreground">Chưa đọc được số dư ký quỹ. Số dư và phần còn thiếu sẽ hiện khi đọc lại được.</p>
        <RefreshButton label="Thử lại" />
      </div>
    );
  }
  const gap = standing.state === "SURPLUS"
    ? <Figure label="Dư" value={formatAmount(standing.surplus ?? 0)} tone="primary" />
    : <Figure label="Còn thiếu" value={formatAmount(standing.shortfall ?? 0)} tone={standing.shortfall ? "warning" : undefined} />;
  return (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
      <Figure label="Mức yêu cầu" value={formatAmount(standing.requiredAmount)} />
      <Figure label="Số dư ký quỹ" value={formatAmount(standing.balance)} note={standing.percent === null ? undefined : `Đạt ${standing.percent}% mức yêu cầu`} />
      {gap}
    </div>
  );
}

const yesNo = (value: boolean | null) => (value ? "có" : "không");

/** The Master's escrow requirement against what it holds. Server-rendered; amounts are never faked as zero. */
export function EscrowStandingCard({ standing }: { standing: EscrowStanding }) {
  const state = ESCROW_STATE[standing.state];
  if (standing.state === "NOT_CONFIGURED") {
    return (
      <Card padding="md" role="region" aria-labelledby="escrow-standing" className="space-y-1">
        <h2 id="escrow-standing" className="text-base font-semibold">Tình trạng ký quỹ</h2>
        <p className="text-sm text-muted-foreground">Flexpay chưa đặt mức ký quỹ cho đơn vị của bạn.</p>
      </Card>
    );
  }
  const deadline = deadlineText(standing);
  return (
    <Card padding="md" role="region" aria-labelledby="escrow-standing" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="escrow-standing" className="text-base font-semibold">Tình trạng ký quỹ</h2>
          <StatusBadge label={state.label} tone={standing.overdue ? "danger" : state.tone} />
        </div>
        {deadline ? <p className="text-sm text-muted-foreground">{deadline}</p> : null}
      </div>
      <Figures standing={standing} />
      <p className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
        <span>Nạp bằng chuyển khoản: <strong className="text-foreground">{yesNo(standing.allowTransfer)}</strong></span>
        <span>Cấn trừ vào lệnh rút của Sub: <strong className="text-foreground">{yesNo(standing.allowSetoff)}</strong></span>
      </p>
    </Card>
  );
}
