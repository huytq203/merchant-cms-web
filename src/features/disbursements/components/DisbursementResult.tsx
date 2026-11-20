import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Notice } from "@/components/page/Notice";
import { StatusBadge } from "@/components/page/StatusBadge";
import { Button } from "@/components/ui/button/Button";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import type { DisbursementView } from "../types/types";
import { viewStatusTone } from "../utils/disbursement-mapper";

type Props = { view: DisbursementView; onCreateAnother: () => void };

/** Tiêu đề theo trạng thái thật của lệnh: lệnh tra lại theo mã có thể đã thất bại/bị hủy nên không được hiện dấu xanh. */
function headline(view: DisbursementView): { title: string; failed: boolean } {
  if (view.status === "FAILED") return { title: "Lệnh chi hộ thất bại", failed: true };
  if (view.status === "CANCELLED") return { title: "Lệnh chi hộ đã bị hủy", failed: true };
  return { title: view.replayed ? "Lệnh này đã được tạo trước đó" : "Đã tạo lệnh chi hộ", failed: false };
}

/** Kết quả sau khi gửi lệnh: trạng thái do hệ thống chi trả, số tài khoản đã được che. */
export function DisbursementResult({ view, onCreateAnother }: Props) {
  const to = view.beneficiary;
  const { title, failed } = headline(view);
  const Icon = failed ? XCircle : CheckCircle2;
  return (
    <div className="mx-auto grid w-full max-w-lg gap-4 py-2">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className={failed ? "flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger" : "flex size-12 items-center justify-center rounded-full bg-success-soft text-success"}>
          <Icon className="size-6" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
        <StatusBadge label={view.statusLabel ?? view.status} tone={viewStatusTone(view.status)} />
      </div>
      {view.approvalRequired ? (
        <Notice tone="info">Lệnh vượt ngưỡng tự duyệt nên đang chờ Admin duyệt trước khi chi.</Notice>
      ) : null}
      <dl aria-label="Lệnh chi hộ" className="rounded-xl border border-border bg-card p-4 text-sm">
        {[
          ["Mã yêu cầu", view.merchantRequestCode],
          ["Người nhận", to ? `${to.accountName ?? ""} · ${to.bankName ?? to.bankCode ?? ""} ${to.accountMasked ?? ""}`.trim() : "—"],
          ["Số tiền chi", formatAmount(view.amount)],
          ["Phí Merchant", view.merchantFee === null || view.merchantFee === undefined ? "—" : formatAmount(view.merchantFee)],
          ["Trừ số dư thu-chi hộ", view.debitAmount === null || view.debitAmount === undefined ? "—" : formatAmount(view.debitAmount)],
          ["Tạo lúc", formatVnDateTime(view.createdAt)],
        ].map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 border-t border-border py-2.5 first:border-t-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCreateAnother}>Tạo lệnh khác</Button>
        <Button variant="solid" nativeButton={false} render={<Link href={`/disbursements?subMerchantId=${view.subId}`} role="link" />}>
          Về tổng quan
        </Button>
      </div>
    </div>
  );
}
