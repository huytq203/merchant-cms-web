import Link from "next/link";
import { StatusBadge, type StatusTone } from "@/components/page/StatusBadge";
import { Card } from "@/components/ui/card/Card";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import type { DisbursementTopup } from "../types/types";
import { TOPUP_STATUS_OPTIONS, topupAccountingLabel, topupPurposeLabel, topupStatusLabel } from "../utils/disbursement-mapper";

type Props = { rows: DisbursementTopup[]; total: number; subId: string; page: number; pageSize: number; status?: string };

const TONES: Record<string, StatusTone> = {
  PENDING_APPROVAL: "warning",
  APPROVING: "info",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

/** Địa chỉ trang với bộ lọc/trang mới; trang 1 và "tất cả" không ghi ra URL. */
function href(subId: string, page: number, status?: string): string {
  const params = new URLSearchParams({ subMerchantId: subId });
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  return `/disbursements/topups?${params.toString()}`;
}

const chip = "rounded-lg border px-3 py-1.5 text-sm";

/**
 * Lệnh nạp của Sub, chỉ đọc: Merchant chuyển tiền rồi theo dõi Kế toán đã ghi nhận chưa. Không hiện người duyệt nội bộ.
 * Render ở server nên lọc và phân trang là các đường dẫn thường.
 */
export function TopupList({ rows, total, subId, page, pageSize, status }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <Card padding="md" role="region" aria-labelledby="topup-heading" className="space-y-4">
      <h2 id="topup-heading" className="text-base font-semibold">Lệnh nạp tiền</h2>
      <nav aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
        {[{ value: "", label: "Tất cả" }, ...TOPUP_STATUS_OPTIONS].map((option) => {
          const active = (status ?? "") === option.value;
          return (
            <Link
              key={option.value}
              href={href(subId, 1, option.value || undefined)}
              aria-current={active ? "true" : undefined}
              className={`${chip} ${active ? "border-primary bg-secondary font-semibold text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Chưa có lệnh nạp nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Danh sách lệnh nạp tiền</caption>
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                {["Mã lệnh nạp", "Mục đích", "Số tiền", "Mã tham chiếu", "Ngày ghi Có", "Trạng thái", "Hạch toán", "Cập nhật", "Lý do"].map((head) => (
                  <th key={head} scope="col" className="px-3 py-2 font-medium">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.orderCode} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{row.orderCode}</td>
                  <td className="px-3 py-2">{topupPurposeLabel(row.purpose)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatAmount(row.amount)}</td>
                  <td className="px-3 py-2">{row.transferReference ?? "—"}</td>
                  <td className="px-3 py-2">{row.creditedOn ?? "—"}</td>
                  <td className="px-3 py-2"><StatusBadge label={topupStatusLabel(row.statusCode)} tone={TONES[row.statusCode] ?? "neutral"} /></td>
                  <td className="px-3 py-2">{topupAccountingLabel(row.accountingStatus)}</td>
                  <td className="px-3 py-2">{row.decidedAt ? formatVnDateTime(row.decidedAt) : "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.decisionReason ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 ? (
        <nav aria-label="Phân trang" className="flex items-center justify-end gap-2 text-sm">
          {page > 1 ? <Link href={href(subId, page - 1, status)} className={`${chip} border-border`}>Trang trước</Link> : null}
          <span className="text-muted-foreground">{`Trang ${page}/${pages}`}</span>
          {page < pages ? <Link href={href(subId, page + 1, status)} className={`${chip} border-border`}>Trang sau</Link> : null}
        </nav>
      ) : null}
    </Card>
  );
}
