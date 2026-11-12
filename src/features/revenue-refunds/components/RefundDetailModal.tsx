"use client";

import { useQuery } from "@tanstack/react-query";
import { DetailItem, DetailList, DetailModal, DetailSection, DetailUnavailableDialog, detailErrorMessage } from "@/components/modal";
import { StatusBadge } from "@/components/page/StatusBadge";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { PAYOUT_STATUS_LABEL, REFUND_STATUS } from "../constants/refund-status";
import { revenueRefundQueries } from "../revenue-refund-queries";
import type { RevenueRefundDetail } from "../types";

interface Props {
  /** Id yêu cầu hoàn tiền cần xem (từ `?detail=`). */
  refundId: string;
  onClose: () => void;
  /** Tên Sub theo id, nếu trang có; thiếu thì hiện mã/tên Sub BE trả kèm. */
  subNames?: Record<string, string>;
}

const empty = "Chưa có";
const money = (value: number | null | undefined) => (value == null ? empty : formatAmount(value));
const when = (value: string | null | undefined) => (value ? formatVnDateTime(value) : empty);

function RefundSections({ refund, subName }: { refund: RevenueRefundDetail; subName?: string }) {
  const status = REFUND_STATUS[refund.status];
  const sub = subName ?? ([refund.subMerchantCode, refund.subMerchantName].filter(Boolean).join(" — ") || empty);
  return (
    <div className="space-y-4">
      <div className="space-y-1 rounded-xl bg-secondary p-4">
        <p className="font-mono text-2xl font-bold tabular-nums text-brand-ink">{formatAmount(refund.amount)}</p>
        <p className="text-sm text-muted-foreground">{refund.fullRefund ? "Toàn phần" : "Một phần"}</p>
        {status.next ? <p className="text-sm text-muted-foreground">{status.next}</p> : null}
      </div>
      <DetailSection title="Thông tin yêu cầu">
        <DetailList>
          <DetailItem label="Đơn hàng">{refund.orderCode || empty}</DetailItem>
          <DetailItem label="Mã giao dịch">{refund.transactionCode || empty}</DetailItem>
          <DetailItem label="Sub-merchant">{sub}</DetailItem>
          <DetailItem label="Tạo lúc">{when(refund.createdAt)}</DetailItem>
          <DetailItem label="Hoàn phí gốc">{money(refund.feeRefund)}</DetailItem>
          <DetailItem label="Chi tiền cho khách">{refund.payoutStatus ? PAYOUT_STATUS_LABEL[refund.payoutStatus] : "—"}</DetailItem>
          <DetailItem label="Lý do hoàn tiền" wide>{refund.reason}</DetailItem>
        </DetailList>
      </DetailSection>
      <DetailSection title="Phê duyệt và chi tiền">
        <DetailList>
          {/* Ẩn "Người duyệt": BE hiện trả approvedBy là UUID thô, chưa có tên để hiển thị. Thời điểm duyệt và
              ghi chú vẫn đủ cho Merchant; hiện lại dòng này khi BE trả tên người duyệt. */}
          <DetailItem label="Duyệt lúc">{when(refund.approvedAt)}</DetailItem>
          <DetailItem label="Chi tiền lúc">{when(refund.payoutAt)}</DetailItem>
          <DetailItem label="Mã tham chiếu chi tiền">{refund.payoutReference || empty}</DetailItem>
          <DetailItem label="Ghi chú quyết định" wide>{refund.decisionNote || empty}</DetailItem>
        </DetailList>
      </DetailSection>
    </div>
  );
}

/**
 * Chi tiết một yêu cầu hoàn tiền theo id. Tự tải bản ghi; API trả 403/404 thì hiện câu thông báo chung chứ không văng trang.
 */
export function RefundDetailModal({ refundId, onClose, subNames }: Props) {
  const query = useQuery({ ...revenueRefundQueries.detail(refundId), retry: false });
  if (query.isError) return <DetailUnavailableDialog message={detailErrorMessage(query.error)} onClose={onClose} />;
  const refund = query.data;
  const status = refund ? REFUND_STATUS[refund.status] : undefined;
  return (
    <DetailModal
      open
      onOpenChange={(open) => !open && onClose()}
      header={{
        monogramInitials: "HT",
        title: "Chi tiết hoàn tiền",
        code: refund?.refundCode ?? "Đang tải",
        statusBadge: status ? <StatusBadge label={status.label} tone={status.tone} /> : undefined,
      }}
      sections={refund ? <RefundSections refund={refund} subName={subNames?.[refund.subMerchantId]} /> : <p className="text-sm text-muted-foreground">Đang tải chi tiết…</p>}
    />
  );
}
