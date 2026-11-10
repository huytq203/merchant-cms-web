"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ResultState } from "@/components/page/ResultState";
import { StatusBadge } from "@/components/page/StatusBadge";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet/Sheet";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { LINE_KIND_LABEL, LINE_STATUS, TERMINAL_TYPE_LABEL } from "../constants/settlement-labels";
import { settlementItemQueries } from "../settlement-item-queries";
import type { SettlementItem, SettlementItemDetail } from "../types";

interface Props {
  row: SettlementItem | null;
  onClose: () => void;
}

const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${new Intl.NumberFormat("vi-VN").format(Math.abs(value))}`;
const money = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)} vnđ`;

/** "Quầy 1 (T0001 · QR)"; "Không gắn Terminal" khi đơn không gắn. */
function terminalLabel(detail: SettlementItemDetail): string {
  if (!detail.terminalCode && !detail.terminalName) return "Không gắn Terminal";
  const type = detail.terminalType ? TERMINAL_TYPE_LABEL[detail.terminalType] ?? detail.terminalType : null;
  const code = [detail.terminalCode, type].filter(Boolean).join(" · ");
  return detail.terminalName ? `${detail.terminalName}${code ? ` (${code})` : ""}` : code;
}

function Summary({ detail }: { detail: SettlementItemDetail }) {
  // Mục 11/12: drawer hiện thêm Sub, Terminal và mã giao dịch FlexPay; BE cũ không gửi thì ẩn dòng tương ứng.
  const subLabel = [detail.subMerchantCode, detail.subMerchantName].filter(Boolean).join(" · ");
  const rows: [string, string][] = [
    ...(detail.transactionCode ? [["Mã giao dịch", detail.transactionCode] as [string, string]] : []),
    ...(subLabel ? [["Sub-merchant", subLabel] as [string, string]] : []),
    ["Terminal", terminalLabel(detail)],
    ["Giá trị gộp", money(detail.grossAmount)],
    ["Phí", money(detail.feeAmount)],
    ["Doanh thu ghi nhận", money(detail.recognisedAmount)],
    ["Đủ chu kỳ quyết toán", formatVnDateTime(detail.tnEligibleAt)],
    ["Hết tạm giữ", detail.heldAmount > 0 && detail.holdReleaseAt ? formatVnDateTime(detail.holdReleaseAt) : "Không tạm giữ"],
  ];
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right tabular-nums break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Lines({ detail }: { detail: SettlementItemDetail }) {
  return (
    <section aria-labelledby="settlement-lines" className="space-y-2">
      <h3 id="settlement-lines" className="text-sm font-semibold">Các dòng</h3>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {detail.lines.map((line) => (
          <li key={line.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="space-y-1">
              <div className="font-semibold">{LINE_KIND_LABEL[line.kind]}</div>
              <StatusBadge label={LINE_STATUS[line.status].label} tone={LINE_STATUS[line.status].tone} />
              {line.withdrawalRequestId ? (
                <div className="text-sm text-muted-foreground">
                  Trong <Link href="/withdrawal" className="font-semibold text-primary hover:underline">lệnh rút tiền</Link>
                </div>
              ) : null}
            </div>
            <span className="font-semibold tabular-nums">{signed(line.amount)}</span>
          </li>
        ))}
      </ul>
      {detail.grossEqualsFeePlusRecognised && detail.recognisedEqualsTranches ? null : (
        <p role="alert" className="text-sm text-danger">Số liệu của đơn hàng này đang lệch. Hãy báo Flexpay để đối soát.</p>
      )}
    </section>
  );
}

/** Lines of one transaction; loaded only when the sheet opens. */
export function SettlementDetailSheet({ row, onClose }: Props) {
  const detail = useQuery({ ...settlementItemQueries.detail(row?.id ?? ""), enabled: Boolean(row) });

  return (
    <Sheet open={Boolean(row)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent size="md">
        <SheetHeader>
          <div>
            <SheetTitle>{row?.orderCode ?? "Chi tiết đơn hàng"}</SheetTitle>
            {row ? <p className="text-sm text-muted-foreground">Mã đơn hàng · thanh toán {formatVnDateTime(row.paidAt)}</p> : null}
          </div>
        </SheetHeader>
        <SheetBody className="space-y-5">
          {detail.isPending ? <ResultState state="loading" loadingLabel="Đang tải chi tiết" /> : null}
          {detail.isError ? <ResultState state="error" errorMessage={detail.error.message} onRetry={() => void detail.refetch()} /> : null}
          {detail.data ? (
            <>
              <Summary detail={detail.data} />
              <Lines detail={detail.data} />
            </>
          ) : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
