import type { ReactNode } from "react";
import Link from "next/link";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import { Card } from "@/components/ui/card/Card";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import type { OrderDetail } from "../types/types";
import { disbursementFailureReason } from "../utils/disbursement-failure-reason";
import { channelLabel, fundingSourceLabel } from "../utils/disbursement-status";
import { DisbursementStatusBadge } from "./DisbursementStatusBadge";

type Props = {
  detail: OrderDetail;
  /** Tên Sub để hiện ("MÃ · Tên"); server tra từ danh sách Sub trong phạm vi, vắng thì hiện dấu gạch. */
  subLabel?: string;
};

const EMPTY = "—";

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `section-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <Card padding="md" role="region" aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-base font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

const money = (value: number) => <span className="font-mono tabular-nums">{formatAmount(value)}</span>;
const orderHref = (operationId: string) => `/disbursements/orders/${operationId}`;

/**
 * Chi tiết lệnh chi hộ trên Portal (màn 6): thông tin lệnh, tiền và phí chụp lúc tạo, kết quả ngân hàng, dòng thời gian,
 * liên kết Chi lại / lô, và các Nạp hoàn trả. Chỉ hiện đúng những gì hợp đồng Portal trả: số tài khoản đã che, không có
 * người duyệt, lỗi thô, mã sổ, chứng từ hay phần lấy từ hạn mức dự phòng của Trả sau (đó là thông tin nội bộ).
 */
export function DisbursementDetail({ detail, subLabel }: Props) {
  const beneficiary = detail.beneficiary;
  const fee = detail.fee;
  const failed = detail.status === "FAILED" || detail.status === "CANCELLED";
  return (
    <div className="space-y-4">
      <Card padding="md" className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{`Lệnh chi hộ ${detail.merchantRequestCode}`}</h2>
          <p className="font-mono text-xs text-muted-foreground">{`Mã lệnh ${detail.operationId}`}</p>
        </div>
        <DisbursementStatusBadge status={detail.status} fallbackLabel={detail.statusLabel} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Thông tin lệnh">
          <dl className="space-y-2">
            <Row label="Mã yêu cầu">{detail.merchantRequestCode}</Row>
            <Row label="Hình thức">{channelLabel(detail.channel)}</Row>
            <Row label="Sub-merchant">{subLabel ?? EMPTY}</Row>
            <Row label="Nguồn tiền">{fundingSourceLabel(detail.fundingSource)}</Row>
            <Row label="Tạo lúc">{formatVnDateTime(detail.createdAt)}</Row>
            <Row label="Hoàn tất lúc">{formatVnDateTime(detail.completedAt)}</Row>
          </dl>
          <ul className="space-y-1 text-sm">
            {detail.batchId ? (
              <li><Link className="text-primary underline-offset-2 hover:underline" href={`/disbursements/batches/${detail.batchId}`}>Lô chi hộ của lệnh này</Link></li>
            ) : null}
            {detail.retryOfOperationId ? (
              <li>
                <Link className="text-primary underline-offset-2 hover:underline" href={orderHref(detail.retryOfOperationId)}>
                  {detail.retryAttempt ? `Lệnh gốc (lệnh này là lần chi lại thứ ${detail.retryAttempt})` : "Lệnh gốc (lệnh này là chi lại)"}
                </Link>
              </li>
            ) : null}
            {/* Có danh sách các lần chi lại thì liên kết nằm ở mục riêng bên dưới; chỉ BE cũ (không có danh sách) mới dùng liên kết đơn. */}
            {detail.retriedByOperationId && detail.retries.length === 0 ? (
              <li><Link className="text-primary underline-offset-2 hover:underline" href={orderHref(detail.retriedByOperationId)}>Lệnh chi lại của lệnh này</Link></li>
            ) : null}
          </ul>
        </Section>

        <Section title="Người thụ hưởng">
          <dl className="space-y-2">
            <Row label="Tên">{beneficiary?.accountName ?? EMPTY}</Row>
            <Row label="Ngân hàng">{beneficiary?.bankCode ? bankDisplayName(beneficiary.bankCode) : (beneficiary?.bankName ?? EMPTY)}</Row>
            <Row label="Số tài khoản"><span className="font-mono">{beneficiary?.accountMasked ?? EMPTY}</span></Row>
          </dl>
        </Section>

        <Section title="Tiền và phí">
          {fee ? (
            <dl className="space-y-2">
              <Row label="Số tiền gốc">{money(detail.amount)}</Row>
              <Row label="Phí MC trước VAT">{money(fee.beforeVat)}</Row>
              <Row label="VAT">{money(fee.vat)}</Row>
              <Row label="Giảm phí">{money(fee.discount)}</Row>
              <Row label="Phí MC sau VAT">{money(fee.afterVat)}</Row>
              <Row label="Phí người nhận">{money(fee.receiverFee)}</Row>
              <Row label="Ghi nợ Merchant">{money(fee.debitAmount)}</Row>
              {/* Số thực chi trong snapshot là số dự kiến; chỉ lệnh Thành công mới thật sự chi, còn lại để dấu gạch kẻo hiểu nhầm tiền đã chuyển. */}
              <Row label="Thực chi">{detail.status === "SUCCEEDED" ? money(fee.payoutAmount) : EMPTY}</Row>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có thông tin phí</p>
          )}
        </Section>

        <Section title="Kết quả ngân hàng">
          <dl className="space-y-2">
            <Row label="Mã tham chiếu ngân hàng"><span className="font-mono">{detail.bankReference ?? EMPTY}</span></Row>
            {/* Lý do dịch sang tiếng Việt từ bảng dùng chung; mã giữ nhỏ bên dưới để Merchant gửi khi cần tra soát. */}
            {failed && detail.failureCode ? (
              <Row label="Lý do thất bại">
                <span className="block">{disbursementFailureReason(detail.failureCode)}</span>
                <span className="block font-mono text-xs font-normal text-muted-foreground">{detail.failureCode}</span>
              </Row>
            ) : null}
            {detail.merchantReason ? <Row label="Lý do">{detail.merchantReason}</Row> : null}
          </dl>
        </Section>
      </div>

      <Section title="Dòng thời gian">
        {detail.timeline.length > 0 ? (
          <ol className="space-y-2 text-sm">
            {detail.timeline.map((step, index) => (
              <li key={`${step.status}-${index}`} className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">{step.label}</span>
                <span className="tabular-nums text-muted-foreground">{formatVnDateTime(step.at)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có mốc trạng thái</p>
        )}
      </Section>

      {/* Chi lại nhiều lần (19/11): mỗi lần là một lệnh riêng, hiện từng lần kèm trạng thái để biết lần nào đã thành công. */}
      {detail.retries.length > 0 ? (
        <Section title="Các lần chi lại">
          <ul className="space-y-2 text-sm">
            {detail.retries.map((item) => (
              <li key={item.operationId} className="flex flex-wrap items-center justify-between gap-2">
                <Link className="font-medium text-primary underline-offset-2 hover:underline" href={orderHref(item.operationId)}>{`Lần chi lại ${item.attempt}`}</Link>
                <DisbursementStatusBadge status={item.status} fallbackLabel={item.statusLabel} />
                <span className="tabular-nums text-muted-foreground">{formatVnDateTime(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {detail.returns.length > 0 ? (
        <Section title="Hoàn trả">
          <ul className="space-y-2 text-sm">
            {detail.returns.map((item) => (
              <li key={item.returnCode} className="flex flex-wrap justify-between gap-2">
                <span className="font-mono font-medium">{item.returnCode}</span>
                <span>{`Gốc ${formatAmount(item.principal)} · hoàn phí ${formatAmount(item.feeRefund)}`}</span>
                <span className="text-muted-foreground">{`${formatVnDateTime(item.returnedAt)} · `}<span>{item.statusLabel ?? EMPTY}</span></span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
