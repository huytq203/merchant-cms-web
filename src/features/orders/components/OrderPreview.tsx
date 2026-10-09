import { formatAmount, formatDate } from "@/lib/utils/helper";

type Props = { amount: number; expiresAt: Date | null };

/** What the customer will pay and when the QR closes, before the order exists. The fee is only known after creation. */
export function OrderPreview({ amount, expiresAt }: Props) {
  return (
    <dl aria-live="polite" className="grid gap-1.5 rounded-xl border border-border bg-secondary px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-muted-foreground">Khách thanh toán</dt>
        <dd className="font-mono text-xl font-bold tabular-nums text-brand-ink">{amount > 0 ? formatAmount(amount) : "—"}</dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-muted-foreground">Phí giao dịch</dt>
        <dd className="font-semibold">Hiện sau khi tạo đơn</dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-muted-foreground">Hết hạn lúc</dt>
        <dd className="font-semibold tabular-nums">{expiresAt ? formatDate(expiresAt.toISOString()) : "Không hết hạn"}</dd>
      </div>
    </dl>
  );
}
