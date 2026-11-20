import type { StatusTone } from "@/components/page/StatusBadge";
import type { BatchAggregate } from "../types/types";

/**
 * Bảy trạng thái hiển thị của lệnh chi hộ Merchant/Sub (ADR-15, `MerchantDisbursementStatus` của disbursement). Thứ tự
 * là thứ tự vòng đời, dùng cho ô lọc và thanh tiến độ của lô. Nhãn khớp từng chữ với BE (dấu "–" là gạch ngang dài).
 */
export const DISBURSEMENT_STATUSES = [
  "PENDING_APPROVAL",
  "APPROVED_AWAITING_DISPATCH",
  "PROCESSING",
  "UNKNOWN",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;

export type DisbursementStatus = (typeof DISBURSEMENT_STATUSES)[number];

const STATUS_LABELS: Record<DisbursementStatus, string> = {
  PENDING_APPROVAL: "Chờ duyệt",
  APPROVED_AWAITING_DISPATCH: "Đã duyệt – chờ chi",
  PROCESSING: "Đang xử lý",
  UNKNOWN: "Chưa rõ kết quả",
  SUCCEEDED: "Thành công",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

const STATUS_TONES: Record<DisbursementStatus, StatusTone> = {
  PENDING_APPROVAL: "warning",
  APPROVED_AWAITING_DISPATCH: "info",
  PROCESSING: "info",
  // "Chưa rõ kết quả": ngân hàng chưa trả lời chắc chắn, tiền vẫn giữ chỗ tới khi đối soát nên cần chú ý.
  UNKNOWN: "warning",
  SUCCEEDED: "success",
  FAILED: "danger",
  CANCELLED: "neutral",
};

const isStatus = (value: string): value is DisbursementStatus => (DISBURSEMENT_STATUSES as readonly string[]).includes(value);

/** Mã lạ (BE thêm sau) hiện nguyên mã thay vì làm hỏng cả danh sách. */
export const statusLabel = (status: string): string => (isStatus(status) ? STATUS_LABELS[status] : status);

export const statusTone = (status: string): StatusTone => (isStatus(status) ? STATUS_TONES[status] : "neutral");

export const DISBURSEMENT_STATUS_OPTIONS = DISBURSEMENT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));

/** Hình thức tạo lệnh (`DisbursementChannel` của flex.merchant). */
export const DISBURSEMENT_CHANNELS = ["SINGLE", "BATCH", "API"] as const;
export type DisbursementChannel = (typeof DISBURSEMENT_CHANNELS)[number];

const CHANNEL_LABELS: Record<DisbursementChannel, string> = { SINGLE: "Đơn lẻ", BATCH: "Lô", API: "API" };

export const channelLabel = (channel: string): string => CHANNEL_LABELS[channel as DisbursementChannel] ?? channel;

export const DISBURSEMENT_CHANNEL_OPTIONS = DISBURSEMENT_CHANNELS.map((value) => ({ value, label: CHANNEL_LABELS[value] }));

const FUNDING_LABELS: Record<string, string> = { PREFUNDED: "Trả trước", POSTFUNDED: "Trả sau", PER_SUB: "Số dư của Sub" };

/**
 * Nguồn tiền của lệnh. Portal chỉ biết loại nguồn: phần lấy từ hạn mức dự phòng của Trả sau là thông tin nội bộ nên BE
 * không trả cho Merchant và màn hình không hiện (xem MerchantPortalDetailView).
 */
export const fundingSourceLabel = (source: string | null | undefined): string =>
  source ? (FUNDING_LABELS[source] ?? source) : "—";

/** Màu trạng thái của lô (không phải của lệnh); dùng chung cho danh sách và chi tiết lô. */
export function batchStatusTone(status: string): StatusTone {
  if (status === "COMPLETED") return "success";
  if (status === "EXPIRED") return "neutral";
  if (status === "DRAFT") return "warning";
  return "info";
}

// ------------------------------------------------------------------ tiến độ lô

/** Lệnh đã có kết cục cuối; mọi trạng thái còn lại là chưa xong (kể cả "Chưa rõ kết quả" vì còn chờ đối soát). */
const TERMINAL: readonly DisbursementStatus[] = ["SUCCEEDED", "FAILED", "CANCELLED"];

export type BatchProgress = {
  total: number;
  finished: number;
  /** Phần trăm lệnh đã có kết cục, làm tròn xuống; 0 khi lô chưa có lệnh. */
  percent: number;
  rows: { status: DisbursementStatus; label: string; tone: StatusTone; count: number }[];
};

/** Tiến độ của lô từ tổng hợp disbursement: đủ 7 dòng trạng thái, khoá thiếu tính 0. */
export function batchProgress(summary: BatchAggregate): BatchProgress {
  const rows = DISBURSEMENT_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    tone: STATUS_TONES[status],
    count: summary.countsByStatus[status] ?? 0,
  }));
  const finished = rows.filter((row) => TERMINAL.includes(row.status)).reduce((sum, row) => sum + row.count, 0);
  const total = summary.orderCount;
  return { total, finished, percent: total > 0 ? Math.floor((finished / total) * 100) : 0, rows };
}
