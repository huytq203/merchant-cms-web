import { ApiError } from "@/lib/http/api-client";

const DUPLICATE_KEY = "DUPLICATE_KEY_ERROR";
const BANK_NOT_FOUND = "BANK_NOT_FOUND";

/** Business errors BE answers with a Vietnamese message; the UI branches on the code (numeric or name), never on text. */
const CODES = {
  otpRequired: ["5731", "MERCHANT_SENSITIVE_OTP_REQUIRED"],
  otpInvalid: ["5732", "MERCHANT_SENSITIVE_OTP_INVALID"],
  otpIssueFailed: ["5733", "MERCHANT_SENSITIVE_OTP_ISSUE_FAILED"],
  zeroNet: ["5760", "MERCHANT_WITHDRAWAL_ZERO_NET_CONFIRMATION"],
  nothingReady: ["5780", "MERCHANT_WITHDRAWAL_NOTHING_READY"],
  statementChanged: ["5781", "MERCHANT_WITHDRAWAL_STATEMENT_CHANGED"],
  ledgerUnavailable: ["5753", "MERCHANT_ESCROW_BALANCE_UNAVAILABLE"],
} as const;

export type WithdrawalFailureKind = keyof typeof CODES | "other";

const LEDGER_UNAVAILABLE_TEXT = "Chưa đọc được số dư từ sổ cái. Vui lòng thử lại sau ít phút.";
const OTP_ISSUE_FAILED_TEXT = "Không gửi được mã OTP, vui lòng thử lại";

/** Which rule BE refused with, so the flow can go back to the right step. A bare BE 503 is the ledger not answering. */
export function withdrawalFailureKind(error: unknown): WithdrawalFailureKind {
  if (!(error instanceof ApiError)) return "other";
  const found = (Object.keys(CODES) as (keyof typeof CODES)[]).find((kind) =>
    (CODES[kind] as readonly string[]).includes(error.code ?? ""),
  );
  if (found) return found;
  // The BFF turns a BE 5xx into 502 and a 5xx body loses its code, so the ledger 503 arrives as `HTTP_503`.
  return error.status === 503 || error.code === "HTTP_503" ? "ledgerUnavailable" : "other";
}

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
  const kind = withdrawalFailureKind(error);
  if (kind === "ledgerUnavailable") return LEDGER_UNAVAILABLE_TEXT;
  if (kind === "otpIssueFailed") return OTP_ISSUE_FAILED_TEXT;
  // The remaining new codes carry Vietnamese text from BE (the 5781 one names the new total), shown as is.
  if (kind !== "other") return error.message;
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
