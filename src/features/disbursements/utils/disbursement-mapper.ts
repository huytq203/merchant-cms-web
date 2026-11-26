import { formatAmount } from "@/lib/utils/helper";
import { statusTone } from "./disbursement-status";
import type {
  BatchSummaryData,
  DisbursementOverview,
  DisbursementPreview,
  DisbursementService,
  NameInquiry,
} from "../types/types";

// ------------------------------------------------------------------ mã yêu cầu

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const two = (value: number) => String(value).padStart(2, "0");

/**
 * Mã yêu cầu sinh sẵn khi mở form: `P` + yyMMddHHmmss + 4 ký tự (CẦN CHỐT 11: người dùng sửa được). Giờ theo máy
 * người dùng; 4 ký tự ngẫu nhiên để hai lệnh tạo trong cùng một giây không trùng mã.
 */
export function generateRequestCode(now: Date = new Date(), random: () => number = Math.random): string {
  const stamp = `${two(now.getFullYear() % 100)}${two(now.getMonth() + 1)}${two(now.getDate())}${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`;
  const suffix = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(random() * CODE_CHARS.length)]).join("");
  return `P${stamp}${suffix}`;
}

// ------------------------------------------------------------------ chặn tạo lệnh

export type CreateGateState = {
  inquiry: NameInquiry | null;
  mismatchAccepted: boolean;
  preview: DisbursementPreview | null;
};

/**
 * Lý do chưa được tạo lệnh, hoặc null khi được đi tiếp. Tra tên là bắt buộc: chưa tra, hoặc môi trường chưa tra được
 * (UNKNOWN) đều chặn, vì không có căn cứ nào nói tên người nhận đúng. Tên khác tên ngân hàng chỉ đi tiếp khi người
 * dùng tick xác nhận chuyển cho chủ tài khoản. Xem trước là chốt cuối: bên chịu phí không hỗ trợ hay vượt hạn mức từng
 * giao dịch thì disbursement chắc chắn từ chối nên chặn sớm.
 */
export function createBlockReason({ inquiry, mismatchAccepted, preview }: CreateGateState): string | null {
  const nameReason = nameGateReason(inquiry, mismatchAccepted);
  if (nameReason) return nameReason;
  if (!preview) return "Cần xem trước phí và số tiền trước khi tạo lệnh";
  if (!preview.feeBearerSupported) return preview.feeBearerMessage ?? "Cấu hình phí chưa hỗ trợ chi hộ cho Sub-merchant này";
  if (preview.perTxnViolation === "BELOW_MIN") return "Số tiền thấp hơn mức tối thiểu mỗi giao dịch";
  if (preview.perTxnViolation === "ABOVE_MAX") return "Số tiền vượt mức tối đa mỗi giao dịch";
  return null;
}

/** Phần cổng tra tên của {@link createBlockReason}: dùng riêng để chặn trước khi hỏi phí xem trước. */
export function nameGateReason(inquiry: NameInquiry | null, mismatchAccepted: boolean): string | null {
  if (!inquiry) return "Cần tra tên người nhận trước khi tạo lệnh";
  if (inquiry.status === "UNKNOWN") return "Chưa tra được tên chủ tài khoản nên chưa thể tạo lệnh";
  if (inquiry.status === "NAME_MISMATCH" && !mismatchAccepted) {
    return "Tên khác tên chủ tài khoản ở ngân hàng, hãy tick xác nhận để tiếp tục";
  }
  return null;
}

// ------------------------------------------------------------------ dịch vụ, số dư

/** Hình thức Chi hộ dùng được trên Portal; API không có màn nên không tính. Dịch vụ tắt thì không còn hình thức nào. */
export function availableModes(service: DisbursementService): { single: boolean; batch: boolean } {
  if (!service.disbursementEnabled) return { single: false, batch: false };
  return { single: service.channels.includes("SINGLE"), batch: service.channels.includes("BATCH") };
}

/** Dấu trừ đứng trước số để Trả sau (số dư hiển thị âm) không bị đọc nhầm thành số dư dương. */
function signed(amount: number): string {
  return amount < 0 ? `-${formatAmount(-amount)}` : formatAmount(amount);
}

export type BalanceSummary = { text: string; negative: boolean; caption: string };

/**
 * Số dư thu-chi hộ để hiện. Trả sau được âm tới −hạn mức cấp: số hiển thị = khả dụng − dư nợ nên có thể âm. Không đọc
 * được sổ cái thì không bịa số.
 */
export function balanceSummary(overview: DisbursementOverview): BalanceSummary {
  const balance = overview.balance;
  if (overview.balanceUnavailable || !balance) {
    return { text: "Chưa đọc được số dư", negative: false, caption: "Vui lòng tải lại sau ít phút." };
  }
  const value = balance.displayBalance ?? balance.available;
  const postfunded = overview.fundingMode === "POSTFUNDED";
  return {
    text: signed(value),
    negative: value < 0,
    caption: postfunded
      ? "Trả sau: số dư có thể âm tới hạn mức được cấp; nạp tiền sẽ bù phần âm trước."
      : "Trả trước: chỉ chi được trong số dư thu-chi hộ.",
  };
}

// ------------------------------------------------------------------ nạp tiền

/** SRS (4) STT 19: chỉ 4 trạng thái; đã hạch toán hay chưa nằm ở cột "Hạch toán", không phải trạng thái. DRAFT không hiện ở Portal. */
const TOPUP_LABELS: Record<string, string> = {
  PENDING_APPROVAL: "Chờ phê duyệt",
  APPROVED: "Hoàn thành",
  REJECTED: "Từ chối",
  CANCELLED: "Hủy",
};

export const TOPUP_STATUS_OPTIONS = Object.entries(TOPUP_LABELS).map(([value, label]) => ({ value, label }));

export const topupStatusLabel = (statusCode: string): string => TOPUP_LABELS[statusCode] ?? statusCode;

/** "Hạch toán" của lệnh nạp; lệnh chưa được duyệt chưa có trạng thái hạch toán nên hiện "—" ở bảng. */
const TOPUP_ACCOUNTING_LABELS: Record<string, string> = { UNPOSTED: "Chưa hạch toán", POSTED: "Đã hạch toán" };
export const topupAccountingLabel = (accountingStatus: string | null | undefined): string =>
  (accountingStatus && TOPUP_ACCOUNTING_LABELS[accountingStatus]) || "—";

const TOPUP_PURPOSE_LABELS: Record<string, string> = { CHI_HO: "Nạp để chi hộ", HOAN: "Nạp để hoàn" };
export const topupPurposeLabel = (purpose: string): string => TOPUP_PURPOSE_LABELS[purpose] ?? purpose;

// ------------------------------------------------------------------ lô

export const BATCH_MAX_BYTES = 2 * 1024 * 1024;

/** Kiểm file trước khi tải lên: phải là .csv, không rỗng, tối đa 2MB (BE kiểm lại dung lượng và khuôn mẫu). */
export function validateBatchFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".csv")) return "Chỉ nhận file CSV (.csv)";
  if (file.size === 0) return "File rỗng, vui lòng chọn file có dữ liệu";
  if (file.size > BATCH_MAX_BYTES) return "File vượt quá 2MB, vui lòng tách thành nhiều lô";
  return null;
}

const BATCH_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Chờ gửi",
  SUBMITTING: "Đang gửi",
  COMPLETED: "Đã gửi xong",
  EXPIRED: "Hết hạn",
};

export const batchStatusLabel = (status: string): string => BATCH_STATUS_LABELS[status] ?? status;

const LINE_STATUS_LABELS: Record<string, string> = {
  INVALID: "Lỗi dữ liệu",
  PENDING: "Chờ gửi",
  ACCEPTED: "Đã nhận",
  REFUSED: "Bị từ chối",
  UNKNOWN: "Chưa xác nhận",
};

export const batchLineStatusLabel = (status: string): string => LINE_STATUS_LABELS[status] ?? status;

/** Đường BFF trả file lỗi (dòng lỗi lúc tải + dòng bị từ chối sau khi gửi) của một lô. */
export const batchErrorFileUrl = (batchId: string): string => `/api/v1/admin/disbursements/batches/${batchId}/errors`;

export const BATCH_TEMPLATE_URL = "/api/v1/admin/disbursements/batches/template";

export type BatchSummaryView = {
  statusLabel: string;
  counts: { total: number; valid: number; invalid: number; accepted: number; refused: number; unknown: number; pending: number };
  /** Số dòng có trong file lỗi. */
  errorRows: number;
  /** Null khi không có dòng lỗi nào để tải. */
  errorFileUrl: string | null;
};

/** Gom số đếm của lô: dòng hợp lệ chưa có kết quả là "chờ gửi" (đang gửi nền). */
export function summarizeBatch(batch: BatchSummaryData): BatchSummaryView {
  const pending = Math.max(0, batch.validRows - batch.acceptedCount - batch.refusedCount - batch.unknownCount);
  const errorRows = batch.invalidRows + batch.refusedCount;
  return {
    statusLabel: batchStatusLabel(batch.status),
    counts: {
      total: batch.totalRows,
      valid: batch.validRows,
      invalid: batch.invalidRows,
      accepted: batch.acceptedCount,
      refused: batch.refusedCount,
      unknown: batch.unknownCount,
      pending,
    },
    errorRows,
    errorFileUrl: errorRows > 0 ? batchErrorFileUrl(batch.batchId) : null,
  };
}

// ------------------------------------------------------------------ hiển thị lệnh

/** Màu theo 7 trạng thái hiển thị: nguồn duy nhất là `disbursement-status.ts`. */
export const viewStatusTone = statusTone;

/** Số tiền nhập có dấu chấm/phẩy ngăn cách nghìn → số nguyên VND; có phần thập phân, chữ khác hoặc rỗng → NaN để schema từ chối. */
export function parseAmountInput(value: string): number {
  // VND không có phần thập phân: "100,5" / "100.50" (1–2 chữ số sau dấu cuối) là gõ nhầm, không đọc thành 1.005 / 10.050.
  if (/[.,]\d{1,2}$/.test(value.trim())) return Number.NaN;
  const digits = value.replace(/[.,\s]/g, "");
  return /^\d+$/.test(digits) ? Number(digits) : Number.NaN;
}
