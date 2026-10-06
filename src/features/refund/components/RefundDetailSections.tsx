import { DollarSign, FileText, XCircle } from "lucide-react";
import { formatAmount } from "@/lib/utils/helper";
import type { Refund } from "../types/type";
import { InfoRow, SectionTitle } from "./RefundDetailParts";

const PANEL = "divide-y divide-border/50 rounded-xl border border-border/60 bg-muted/30 px-4";

export function RefundFinanceSection({ refund }: { refund: Refund }) {
  const merchantBears = refund.actualAmount + refund.feeMb;
  return (
    <section>
      <SectionTitle icon={DollarSign} title="Thông tin tài chính" />
      <div className={PANEL}>
        <InfoRow label="Số tiền yêu cầu:" value={formatAmount(refund.requestAmount)} />
        <InfoRow label="Phí người bán (MB):" value={formatAmount(refund.feeMb)} />
        <InfoRow
          label="Thực hoàn khách nhận:"
          value={formatAmount(refund.actualAmount)}
          valueClassName="font-semibold text-danger"
        />
        <InfoRow
          label="Thực hoàn merchant chịu:"
          value={formatAmount(merchantBears)}
          valueClassName="font-semibold text-danger"
        />
      </div>
    </section>
  );
}

export function RefundReconciliationSection({ refund }: { refund: Refund }) {
  return (
    <section>
      <SectionTitle icon={FileText} title="Thông tin đối soát" />
      <div className={PANEL}>
        <InfoRow
          label="Mã giao dịch gốc:"
          value={<span className="font-mono text-primary">{refund.transactionCode}</span>}
        />
        <InfoRow label="Mã hóa đơn:" value={refund.invoiceCode ?? "—"} />
        <InfoRow
          label="Người nhận:"
          value={
            <span>
              {refund.recipientName}
              {refund.recipientCard && (
                <span className="ml-1 font-mono text-xs text-muted-foreground">
                  ({refund.recipientCard})
                </span>
              )}
            </span>
          }
        />
      </div>
    </section>
  );
}

export function RefundReasonSection({ refund }: { refund: Refund }) {
  const rejected = refund.status === "rejected";
  const tone = rejected
    ? "border-danger/20 bg-danger/5 text-foreground"
    : "border-border/60 bg-muted/30 text-muted-foreground";
  return (
    <section>
      <SectionTitle
        icon={rejected ? XCircle : FileText}
        title={rejected ? "Lý do từ chối" : "Lý do hoàn tiền"}
      />
      <blockquote className={`rounded-xl border px-4 py-3 text-sm italic leading-relaxed ${tone}`}>
        &ldquo;{refund.reason}&rdquo;
      </blockquote>
    </section>
  );
}
