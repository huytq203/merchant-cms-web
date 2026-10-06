import { ApiError } from "@/lib/http/api-client";

export type BankErrorKind = "otp" | "conflict" | "other";

export type BankErrorView = { kind: BankErrorKind; message: string };

const OTP_INVALID = "MERCHANT_SENSITIVE_OTP_INVALID";
const OTP_REQUIRED = "MERCHANT_SENSITIVE_OTP_REQUIRED";
const OTP_ISSUE_FAILED = "MERCHANT_SENSITIVE_OTP_ISSUE_FAILED";
const ALREADY_PENDING = "MERCHANT_BANK_ACCOUNT_CHANGE_ALREADY_PENDING";

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
  if (error.code === ALREADY_PENDING) {
    return { kind: "other", message: "Tài khoản đang có yêu cầu thay đổi chờ duyệt, chưa thể gửi thêm." };
  }
  if (error.status === 409) return { kind: "conflict", message: STALE_VERSION_MESSAGE };
  return { kind: "other", message: error.message };
}
