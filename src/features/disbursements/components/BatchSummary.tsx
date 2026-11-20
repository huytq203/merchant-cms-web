"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Notice } from "@/components/page/Notice";
import { StatusBadge } from "@/components/page/StatusBadge";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { disbursementQueries } from "../disbursement-queries";
import { useBatchSubmit } from "../hooks/use-disbursement-batch";
import type { BatchDetail } from "../types/types";
import { batchLineStatusLabel, summarizeBatch } from "../utils/disbursement-mapper";
import { batchProgress, batchStatusTone } from "../utils/disbursement-status";
import { BatchProgressBar } from "./BatchProgressBar";
import { DisbursementOtpStep } from "./DisbursementOtpStep";

type Props = { initial: BatchDetail; canCreate: boolean };

const POLL_MS = 5_000;
const isPast = (iso: string | null | undefined) => Boolean(iso) && new Date(iso as string).getTime() <= Date.now();
const lineTone = (status: string) =>
  status === "ACCEPTED" ? "success" : status === "REFUSED" || status === "INVALID" ? "danger" : status === "UNKNOWN" ? "warning" : "neutral";

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * Tóm tắt lô: tổng/hợp lệ/lỗi/đã nhận/bị từ chối/chưa xác nhận, link tải file lỗi và từng dòng. Lô nháp còn hạn và có dòng
 * hợp lệ thì gửi được (cần OTP, người có quyền + OTP là gửi, không có duyệt nội bộ). Lô đang gửi tự cập nhật tiến độ.
 */
export function BatchSummary({ initial, canCreate }: Props) {
  const batchId = initial.batch.batchId;
  const query = useQuery({
    ...disbursementQueries.batch(batchId),
    initialData: initial,
    refetchInterval: (current) => (current.state.data?.batch.status === "SUBMITTING" ? POLL_MS : false),
  });
  const detail = query.data;
  const summary = summarizeBatch(detail.batch);
  const submit = useBatchSubmit(detail.batch);
  // Lô nháp sống 30 phút (CẦN CHỐT 13): quá hạn mà chưa bị dọn thì BE sẽ từ chối (6325) nên không hiện nút gửi.
  const expired = detail.batch.status === "EXPIRED" || (detail.batch.status === "DRAFT" && isPast(detail.batch.expiresAt));
  const canSubmit = canCreate && detail.batch.status === "DRAFT" && !expired && detail.batch.validRows > 0;

  if (submit.challenge) {
    return (
      <Card padding="md">
        <DisbursementOtpStep
          challenge={submit.challenge}
          purpose="gửi lô chi hộ"
          submitLabel="Gửi lô"
          failure={submit.failure}
          isSubmitting={submit.isSending}
          isResending={submit.isRequestingCode}
          onSubmit={(otp) => void submit.submit(otp)}
          onResend={() => void submit.requestCode()}
          onBack={submit.cancel}
        />
      </Card>
    );
  }

  const { counts } = summary;
  // Tiến độ chi của các lệnh (GĐ5): chỉ có khi lô đã gửi và disbursement đã có lệnh; đọc lỗi thì nói rõ, không bịa số.
  const progress = detail.summary && detail.summary.orderCount > 0 ? batchProgress(detail.summary) : null;
  return (
    <div className="space-y-4">
      <Card padding="md" role="region" aria-labelledby="batch-heading" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="batch-heading" className="text-base font-semibold">{`Lô ${detail.batch.batchCode}`}</h2>
            <p className="text-sm text-muted-foreground">
              {`${detail.batch.fileName ?? "—"} · tải lên ${formatVnDateTime(detail.batch.createdAt)} · tổng tiền hợp lệ ${formatAmount(detail.batch.totalAmount)}`}
            </p>
          </div>
          <StatusBadge label={summary.statusLabel} tone={batchStatusTone(detail.batch.status)} />
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Count label="Tổng số dòng" value={counts.total} />
          <Count label="Hợp lệ" value={counts.valid} />
          <Count label="Lỗi dữ liệu" value={counts.invalid} />
          <Count label="Chờ gửi" value={counts.pending} />
          <Count label="Đã nhận" value={counts.accepted} />
          <Count label="Bị từ chối" value={counts.refused} />
          <Count label="Chưa xác nhận" value={counts.unknown} />
        </dl>
        {detail.batch.status === "DRAFT" && counts.invalid > 0 ? (
          <Notice tone="warning">Chỉ các dòng hợp lệ được gửi; các dòng lỗi nằm trong file lỗi để bạn sửa và tải lại thành lô mới.</Notice>
        ) : null}
        {detail.batch.status === "SUBMITTING" ? <Notice tone="info">Hệ thống đang gửi từng lệnh, màn hình tự cập nhật tiến độ.</Notice> : null}
        {expired ? <Notice tone="danger">Lô đã hết hạn, vui lòng tải lại file để tạo lô mới.</Notice> : null}
        {detail.batch.status === "DRAFT" && !expired && detail.batch.expiresAt ? (
          <p className="text-sm text-muted-foreground">{`Hết hạn lúc ${formatVnDateTime(detail.batch.expiresAt)}, cần gửi trước thời điểm này.`}</p>
        ) : null}
        {submit.failure ? <Notice tone="danger">{submit.failure}</Notice> : null}
        <div className="flex flex-wrap justify-end gap-2">
          {summary.errorFileUrl && canCreate ? (
            <Button variant="outline" nativeButton={false} render={<a href={summary.errorFileUrl} download aria-label="Tải file lỗi" role="link" />}>
              <Download className="size-4" aria-hidden />
              {`Tải file lỗi (${summary.errorRows} dòng)`}
            </Button>
          ) : null}
          {canSubmit ? (
            <Button type="button" variant="solid" isLoading={submit.isRequestingCode} onClick={() => void submit.requestCode()}>
              Gửi lô
            </Button>
          ) : null}
        </div>
      </Card>
      {detail.summaryUnavailable ? <Notice tone="warning">Chưa đọc được tiến độ chi của lô, vui lòng tải lại sau ít phút.</Notice> : null}
      {progress && detail.summary ? (
        <Card padding="md" role="region" aria-labelledby="batch-progress-heading" className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="batch-progress-heading" className="text-base font-semibold">Tiến độ chi</h2>
              <p className="text-sm text-muted-foreground">
                {`${progress.finished}/${progress.total} lệnh đã có kết quả · đã chi thành công ${formatAmount(detail.summary.succeededAmount)} trên tổng ${formatAmount(detail.summary.totalAmount)}`}
              </p>
            </div>
            <Link className="text-sm text-primary underline-offset-2 hover:underline" href={`/disbursements/orders?batchId=${detail.batch.batchId}`}>
              Xem các lệnh của lô
            </Link>
          </div>
          <BatchProgressBar progress={progress} />
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {progress.rows.map((row) => (
              <Count key={row.status} label={row.label} value={row.count} />
            ))}
          </dl>
        </Card>
      ) : null}
      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Các dòng của lô</caption>
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              {["Dòng", "Mã yêu cầu", "Ngân hàng", "Số tài khoản", "Số tiền", "Trạng thái", "Ghi chú"].map((head) => (
                <th key={head} scope="col" className="px-3 py-2 font-medium">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {detail.lines.map((line) => (
              <tr key={line.lineNo} className="border-t border-border">
                <td className="px-3 py-2 tabular-nums">{line.lineNo}</td>
                <td className="px-3 py-2">{line.merchantRequestCode ?? "—"}</td>
                <td className="px-3 py-2">{line.bankCode ?? "—"}</td>
                <td className="px-3 py-2">{line.accountMasked ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">{line.amount === null || line.amount === undefined ? "—" : formatAmount(line.amount)}</td>
                <td className="px-3 py-2"><StatusBadge label={batchLineStatusLabel(line.status)} tone={lineTone(line.status)} /></td>
                <td className="px-3 py-2 text-muted-foreground">{line.validationError ?? line.resultMessage ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
