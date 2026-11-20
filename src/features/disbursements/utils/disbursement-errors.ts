import { ApiError } from "@/lib/http/api-client";

/**
 * Mã lỗi BE của Chi hộ Portal. 4xx trả tên enum ở `code` (số 63xx nằm ở `status` của BE), còn lệnh bị disbursement
 * từ chối trả `DISBURSEMENT_REFUSED`; UI rẽ nhánh theo mã (số hoặc tên), không bao giờ theo câu chữ.
 */
const CODES = {
  otpRequired: ["5731", "MERCHANT_SENSITIVE_OTP_REQUIRED"],
  otpInvalid: ["5732", "MERCHANT_SENSITIVE_OTP_INVALID"],
  otpIssueFailed: ["5733", "MERCHANT_SENSITIVE_OTP_ISSUE_FAILED"],
  notEnabled: ["6322", "MERCHANT_DISBURSEMENT_NOT_ENABLED"],
  // 6323: chưa xác nhận được lệnh với hệ thống chi (503). Lệnh CÓ THỂ đã lưu nên gửi lại cùng mã yêu cầu.
  unconfirmed: ["6323", "MERCHANT_DISBURSEMENT_UNAVAILABLE"],
  batchInvalid: ["6324", "MERCHANT_DISBURSEMENT_BATCH_INVALID"],
  batchState: ["6325", "MERCHANT_DISBURSEMENT_BATCH_STATE_INVALID"],
  rateLimited: ["6326", "MERCHANT_DISBURSEMENT_NAME_INQUIRY_RATE_LIMITED"],
  inquiryUnavailable: ["6328", "MERCHANT_DISBURSEMENT_NAME_INQUIRY_UNAVAILABLE"],
  refused: ["DISBURSEMENT_REFUSED"],
} as const;

export type DisbursementFailureKind = keyof typeof CODES | "other";

/** Màn hình nào đang hiện lỗi: quyết định câu khi BE chỉ trả 5xx đã mất mã. */
export type DisbursementErrorContext = "create" | "inquiry" | "other";

export const UNCONFIRMED_TEXT = "Chưa xác nhận được lệnh chi hộ với hệ thống chi. Vui lòng gửi lại với cùng mã yêu cầu sau ít phút.";
const INQUIRY_UNAVAILABLE_TEXT = "Chưa tra được tên chủ tài khoản, vui lòng thử lại.";
const RATE_LIMITED_TEXT = "Bạn thao tác quá nhiều lần. Vui lòng chờ khoảng 1 phút rồi thử lại.";
const OTP_ISSUE_FAILED_TEXT = "Không gửi được mã OTP, vui lòng thử lại";
const GENERIC_TEXT = "Không thực hiện được, vui lòng thử lại";

export function disbursementFailureKind(error: unknown): DisbursementFailureKind {
  if (!(error instanceof ApiError)) return "other";
  const found = (Object.keys(CODES) as (keyof typeof CODES)[]).find((kind) =>
    (CODES[kind] as readonly string[]).includes(error.code ?? ""),
  );
  if (found) return found;
  return error.status === 429 ? "rateLimited" : "other";
}

/**
 * Chưa biết lệnh đã lưu hay chưa: 6323, mọi 5xx (BE/BFF làm mất mã), timeout và lỗi mạng của trình duyệt. KHÔNG phải
 * "bị từ chối" nên không được đổi mã yêu cầu hay báo thất bại; người dùng gửi lại cùng mã hoặc tra lại lệnh.
 */
export function isOutcomeUnknown(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  return disbursementFailureKind(error) === "unconfirmed" || error.status >= 500;
}

/** Câu tiếng Việt hiện cho người dùng; câu của BE được giữ nguyên khi BE đã trả sẵn tiếng Việt. */
export function describeDisbursementError(error: unknown, context: DisbursementErrorContext = "other"): string {
  const kind = disbursementFailureKind(error);
  if (kind === "rateLimited") return RATE_LIMITED_TEXT;
  if (kind === "otpIssueFailed") return OTP_ISSUE_FAILED_TEXT;
  // 6323 khi tạo/tra lệnh: câu "gửi lại cùng mã yêu cầu" là chốt chặn chi hai lần. Ở thao tác khác (gửi lô, đọc) câu đó
  // sai ngữ cảnh nên hiện nguyên câu BE/BFF đã trả (chốt 20/11: hiện nguyên câu lỗi chặn, kể cả 503).
  if (kind === "unconfirmed") {
    return context !== "create" && error instanceof ApiError && error.message ? error.message : UNCONFIRMED_TEXT;
  }
  if (kind === "inquiryUnavailable") return INQUIRY_UNAVAILABLE_TEXT;
  if (!(error instanceof ApiError)) return context === "create" ? UNCONFIRMED_TEXT : GENERIC_TEXT;
  // 5xx: BFF/BE đã bỏ câu gốc, chỉ còn câu chung nên thay bằng câu đúng ngữ cảnh.
  if (error.status >= 500) return context === "create" ? UNCONFIRMED_TEXT : context === "inquiry" ? INQUIRY_UNAVAILABLE_TEXT : error.message || GENERIC_TEXT;
  return error.message || GENERIC_TEXT;
}

const ORDER_NOT_FOUND_CODES = ["RESOURCE_NOT_FOUND", "1003"];
/** Câu BE dùng cho "không có lệnh"; 404 "Không tìm thấy Sub-merchant" dùng cùng mã nên chỉ còn câu để phân biệt. */
const ORDER_NOT_FOUND_TEXT = "Không tìm thấy lệnh chi hộ";

/**
 * 404 của tra lệnh theo mã yêu cầu nghĩa là "chưa có lệnh với mã này". BE cũng trả 404 cùng mã RESOURCE_NOT_FOUND khi Sub
 * ngoài phạm vi/bị gỡ gán, nên phải kèm câu của BE mới kết luận được (CẦN CHỐT: BE nên có mã riêng cho "không có lệnh").
 */
export function isOrderNotFound(error: unknown): boolean {
  return error instanceof ApiError
    && error.status === 404
    && ORDER_NOT_FOUND_CODES.includes(error.code ?? "")
    && error.message.trim() === ORDER_NOT_FOUND_TEXT;
}
