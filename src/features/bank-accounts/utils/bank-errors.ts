import { ApiError } from "@/lib/http/api-client";

/** `holderName`: tên chủ TK bị từ chối, hiển thị ngay ô Chủ tài khoản ở form (không ở bước OTP). */
export type BankErrorKind = "otp" | "conflict" | "holderName" | "other";

export type BankErrorView = { kind: BankErrorKind; message: string };

const OTP_INVALID = "MERCHANT_SENSITIVE_OTP_INVALID";
const OTP_REQUIRED = "MERCHANT_SENSITIVE_OTP_REQUIRED";
const OTP_ISSUE_FAILED = "MERCHANT_SENSITIVE_OTP_ISSUE_FAILED";
const ALREADY_PENDING = "MERCHANT_BANK_ACCOUNT_CHANGE_ALREADY_PENDING";

/**
 * BE (quyết định 10/11, BankAccountHolderPolicy) từ chối TÊN chủ TK sau bước OTP: 5803 tra tên tại ngân hàng thất bại,
 * 5804 tên khai báo không khớp tên ngân hàng trả về, 5729 không khớp tên pháp nhân KYB của Master. Người dùng sửa ở
 * form chứ không phải ở ô mã, nên các lỗi này đưa về ô Chủ tài khoản. BE gửi mã số hoặc tên, nhận cả hai.
 */
const HOLDER_NAME_CODES: readonly string[] = [
  "5803", "MERCHANT_BANK_ACCOUNT_HOLDER_INQUIRY_UNAVAILABLE",
  "5804", "MERCHANT_BANK_ACCOUNT_HOLDER_BANK_MISMATCH",
  "5729", "MERCHANT_BANK_ACCOUNT_HOLDER_MISMATCH",
];

export const STALE_VERSION_MESSAGE = "Dữ liệu đã thay đổi, vui lòng tải lại";

/**
 * Turns a failed request into something the dialog can act on. The wrong-OTP message is fixed
 * Vietnamese text because the BE forwards identity's wording, which can be in any language.
 */
export function describeBankError(error: unknown): BankErrorView {
  if (!(error instanceof ApiError)) {
    return { kind: "other", message: "Không thực hiện được, vui lòng thử lại" };
  }
  if (error.code === OTP_INVALID) {
    return { kind: "otp", message: "Mã OTP không đúng hoặc đã hết hạn. Hãy kiểm tra lại hoặc gửi lại mã." };
  }
  if (error.code === OTP_REQUIRED) {
    return { kind: "otp", message: "Vui lòng nhập mã OTP để xác nhận." };
  }
  if (error.code === OTP_ISSUE_FAILED) {
    return { kind: "otp", message: "Không gửi được mã OTP, vui lòng thử lại sau." };
  }
  // Câu của BE đã là tiếng Việt cố định (không chứa tên ngân hàng trả về) nên hiển thị nguyên văn.
  if (HOLDER_NAME_CODES.includes(error.code ?? "")) return { kind: "holderName", message: error.message };
  if (error.code === ALREADY_PENDING) {
    return { kind: "other", message: "Tài khoản đang có yêu cầu thay đổi chờ duyệt, chưa thể gửi thêm." };
  }
  if (error.status === 409) return { kind: "conflict", message: STALE_VERSION_MESSAGE };
  return { kind: "other", message: error.message };
}
