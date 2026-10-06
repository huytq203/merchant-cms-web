import { ApiError } from "@/lib/http/api-client";

const DUPLICATE_KEY = "DUPLICATE_KEY_ERROR";
const BANK_NOT_FOUND = "BANK_NOT_FOUND";

/**
 * The BE answers some business rules in English; these are the messages it really throws while a
 * withdrawal request is created or read (MerchantWithdrawalRequestServiceImpl and
 * MerchantDailyWithdrawalLimitService). Messages that end with a limit level are matched by prefix.
 */
const MESSAGE_TRANSLATIONS: ReadonlyArray<{ match: string; text: string }> = [
  { match: "Idempotency key was already used", text: "Yêu cầu này đã được gửi với nội dung khác, vui lòng tải lại danh sách" },
  { match: "Withdrawal idempotency key belongs to", text: "Yêu cầu này do người dùng khác tạo, vui lòng tải lại danh sách" },
  { match: "Withdrawal idempotency key already exists", text: "Yêu cầu này đã được gửi, vui lòng tải lại danh sách" },
  { match: "Withdrawal bank account is on hold", text: "Tài khoản ngân hàng đang bị tạm giữ, không thể rút tiền" },
  {
    match: "Withdrawal bank account is not registered and active for this merchant",
    text: "Tài khoản ngân hàng chưa đăng ký hoặc không còn hoạt động",
  },
  { match: "Withdrawal amount must be positive", text: "Số tiền rút phải lớn hơn 0" },
  { match: "Withdrawal amount is below the configured minimum", text: "Số tiền rút thấp hơn hạn mức tối thiểu cho phép" },
  { match: "Withdrawal amount exceeds the configured maximum", text: "Số tiền rút vượt hạn mức tối đa cho phép" },
  { match: "Daily merchant withdrawal limit exceeded", text: "Số tiền rút vượt hạn mức trong ngày" },
  { match: "Merchant settlement limits are suspended", text: "Hạn mức đối soát của merchant đang bị tạm ngưng" },
  { match: "Withdrawal has already entered payout processing", text: "Yêu cầu đã chuyển sang xử lý chi trả, không thể thay đổi" },
];

/** The BE can answer a business rule in English, so the codes and messages above get fixed Vietnamese text. */
export function describeWithdrawalError(error: unknown): string {
  if (!(error instanceof ApiError)) return "Không gửi được yêu cầu, vui lòng thử lại";
  if (error.code === DUPLICATE_KEY) {
    return "Yêu cầu này đã được gửi hoặc nội dung đã thay đổi, vui lòng tải lại danh sách";
  }
  if (error.code === BANK_NOT_FOUND) {
    return "Tài khoản ngân hàng chưa đăng ký hoặc không còn hoạt động";
  }
  const translated = MESSAGE_TRANSLATIONS.find((entry) => error.message.startsWith(entry.match));
  return translated ? translated.text : error.message;
}

/** Field-level errors the BE attached to a rejected request, keyed by field name. */
export function readFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || typeof error.details !== "object" || error.details === null) return {};
  const entries = Object.entries(error.details).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return Object.fromEntries(entries);
}
