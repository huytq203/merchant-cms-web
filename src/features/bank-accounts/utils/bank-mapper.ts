import type { StatusTone } from "@/components/page/StatusBadge";
import { BANK_OPTIONS } from "../constants/bank-options";
import { bankAccountSchema } from "../schemas/bank-account.schema";
import type { BankAccount, BankAccountFormValues, BankAccountStatus, BankOtp, CreateBankRequest, UpdateBankRequest } from "../types";

/** Bank holder names are stored in capitals without diacritics, as the bank prints them. */
export const normalizeAccountName = (value: string): string =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toUpperCase();

const filled = (value: string | undefined): string | undefined => value?.trim() || undefined;
const confirmation = (otpSessionId: string | null, otp: string | null): BankOtp | undefined =>
  otpSessionId && otp ? { otpSessionId, otp } : undefined;

export const toBankAccount = (response: unknown): BankAccount => bankAccountSchema.parse(response);

export function toCreateBankRequest(values: BankAccountFormValues, otpSessionId: string | null, otp: string | null): CreateBankRequest {
  const otpValue = confirmation(otpSessionId, otp);
  return {
    bankCode: values.bankCode.trim(),
    accountNumber: values.accountNumber,
    accountName: normalizeAccountName(values.accountName.trim()),
    // Luôn gửi danh sách (kể cả rỗng) để TK mới được gán đúng các Sub đã chọn trên form.
    assignSubMerchantIds: [...values.assignSubMerchantIds],
    ...(filled(values.branchName) ? { branchName: filled(values.branchName) } : {}),
    ...(values.isDefault !== undefined ? { isDefault: values.isDefault } : {}),
    ...(otpValue ? { otp: otpValue } : {}),
  };
}

/** The BE returns the number masked, so an unchanged identity field must not be sent back: it would read as a change. */
const changed = (value: string | undefined, current: string): string | undefined => {
  const next = filled(value);
  return next && next !== current ? next : undefined;
};

/** Cùng tập Sub (không kể thứ tự) thì không phải thay đổi gán: không gửi, không đòi OTP. */
export const isAssignmentChanged = (account: Pick<BankAccount, "assignedSubMerchants">, ids: readonly string[]): boolean => {
  const current = new Set(account.assignedSubMerchants.map((sub) => sub.id));
  const next = new Set(ids);
  return current.size !== next.size || [...next].some((id) => !current.has(id));
};

export function toUpdateBankRequest(values: BankAccountFormValues, account: BankAccount, otpSessionId: string | null, otp: string | null): UpdateBankRequest {
  const otpValue = confirmation(otpSessionId, otp);
  const accountName = changed(values.accountName && normalizeAccountName(values.accountName), account.accountName);
  return {
    version: account.version,
    ...(changed(values.bankCode, account.bankCode) ? { bankCode: changed(values.bankCode, account.bankCode) } : {}),
    ...(changed(values.accountNumber, account.accountNumber) ? { accountNumber: changed(values.accountNumber, account.accountNumber) } : {}),
    ...(accountName ? { accountName } : {}),
    ...(filled(values.branchName) ? { branchName: filled(values.branchName) } : {}),
    // Gửi danh sách đầy đủ SAU khi lưu, chỉ khi thực sự đổi (BE hiểu thiếu trường = giữ nguyên).
    ...(isAssignmentChanged(account, values.assignSubMerchantIds) ? { assignSubMerchantIds: [...values.assignSubMerchantIds] } : {}),
    ...(otpValue ? { otp: otpValue } : {}),
  };
}

/** Bank, number or holder changes need an OTP (QT-07). */
export const isBankIdentityChanged = (
  account: Pick<BankAccount, "bankCode" | "accountNumber" | "accountName">,
  values: Pick<BankAccountFormValues, "bankCode" | "accountNumber" | "accountName">,
): boolean =>
  account.bankCode !== values.bankCode.trim()
  || account.accountNumber !== values.accountNumber.trim()
  || account.accountName !== values.accountName.trim();

/** OTP bắt buộc khi đổi danh tính TK hoặc danh sách Sub (hợp đồng PUT v2). */
export const needsBankOtp = (account: BankAccount, values: BankAccountFormValues): boolean =>
  isBankIdentityChanged(account, values) || isAssignmentChanged(account, values.assignSubMerchantIds);

const STATUS_VIEW: Record<BankAccountStatus, { label: string; tone: StatusTone }> = {
  PENDING_VERIFICATION: { label: "Chờ xác minh", tone: "warning" },
  VERIFIED: { label: "Đã xác minh", tone: "success" },
  LOCKED: { label: "Khóa", tone: "danger" },
};

export const bankAccountStatusLabel = (status: BankAccountStatus): string => STATUS_VIEW[status].label;
/** Cam = Chờ xác minh, xanh = Đã xác minh, đỏ = Khóa. */
export const bankAccountStatusTone = (status: BankAccountStatus): StatusTone => STATUS_VIEW[status].tone;

/** Falls back to the code so an account at a bank outside the catalogue is still readable. */
export const bankDisplayName = (bankCode: string): string =>
  BANK_OPTIONS.find((option) => option.value === bankCode)?.label ?? bankCode;

/** What the user sees for an account in actions and dialogs: bank and the number as the BE masked it, never the id. */
export const bankAccountTitle = (account: Pick<BankAccount, "bankCode" | "accountNumber">): string =>
  `${bankDisplayName(account.bankCode)} ${account.accountNumber}`;
