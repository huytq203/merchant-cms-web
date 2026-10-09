import { BANK_OPTIONS } from "../constants/bank-options";
import { bankAccountSchema } from "../schemas/bank-account.schema";
import type { BankAccount, BankAccountFormValues, BankChangeRequest, BankOtp, CreateBankRequest, UpdateBankRequest } from "../types";

/** Bank holder names are stored in capitals without diacritics, as the bank prints them. */
export const normalizeAccountName = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toUpperCase();

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
    ...(filled(values.branchName) ? { branchName: filled(values.branchName) } : {}),
    ...(values.scope === "SUB" && values.subMerchantId ? { subMerchantId: values.subMerchantId } : {}),
    ...(values.isDefault !== undefined ? { isDefault: values.isDefault } : {}),
    ...(otpValue ? { otp: otpValue } : {}),
  };
}

/** The BE returns the number masked, so an unchanged identity field must not be sent back: it would read as a change. */
const changed = (value: string | undefined, current: string): string | undefined => {
  const next = filled(value);
  return next && next !== current ? next : undefined;
};

export function toUpdateBankRequest(values: BankAccountFormValues, account: BankAccount, otpSessionId: string | null, otp: string | null): UpdateBankRequest {
  const otpValue = confirmation(otpSessionId, otp);
  return {
    version: account.version,
    ...(changed(values.bankCode, account.bankCode) ? { bankCode: changed(values.bankCode, account.bankCode) } : {}),
    ...(changed(values.accountNumber, account.accountNumber) ? { accountNumber: changed(values.accountNumber, account.accountNumber) } : {}),
    ...(changed(values.accountName && normalizeAccountName(values.accountName), account.accountName) ? { accountName: changed(values.accountName && normalizeAccountName(values.accountName), account.accountName) } : {}),
    ...(filled(values.branchName) ? { branchName: filled(values.branchName) } : {}),
    ...(values.status ? { status: values.status } : {}),
    ...(filled(values.reason) ? { reason: filled(values.reason) } : {}),
    ...(otpValue ? { otp: otpValue } : {}),
  };
}

export const bankLinkLabel = (account: BankAccount): string => ({
  LINKED: "Đã liên kết",
  PENDING_VERIFICATION: "Chờ xác minh",
  LINK_FAILED: "Liên kết thất bại",
})[account.linkStatus];

/**
 * BE keeps one PENDING change per account and does not promote a stopped account.
 * A failed link stays editable so the number can be corrected.
 */
export const canChangeBank = (account: BankAccount): boolean =>
  account.status !== "INACTIVE" && account.pendingChangeRequest?.status !== "PENDING";

/** Bank, number or holder changes need an OTP and (for a linked account) a re-verification. */
export const isBankIdentityChanged = (
  account: Pick<BankAccount, "bankCode" | "accountNumber" | "accountName">,
  values: Pick<BankAccountFormValues, "bankCode" | "accountNumber" | "accountName">,
): boolean =>
  account.bankCode !== values.bankCode.trim()
  || account.accountNumber !== values.accountNumber.trim()
  || account.accountName !== values.accountName.trim();

export const bankStatusLabel = (status: BankAccount["status"]): string => ({
  ACTIVE: "Đang dùng",
  INACTIVE: "Ngừng sử dụng",
  VERIFIED: "Đang dùng",
})[status];

export const changeRequestStatusLabel = (status: BankChangeRequest["status"]): string => ({
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
})[status];

/** Falls back to the code so an account at a bank outside the catalogue is still readable. */
export const bankDisplayName = (bankCode: string): string =>
  BANK_OPTIONS.find((option) => option.value === bankCode)?.label ?? bankCode;

/** What the user sees for an account in actions and dialogs: bank and the number as the BE masked it, never the id. */
export const changeTypeLabel = (changeType: string): string => (
  changeType === "SET_DEFAULT" ? "Đặt làm tài khoản mặc định" : "Cập nhật thông tin tài khoản"
);

export const bankAccountTitle = (account: Pick<BankAccount, "bankCode" | "accountNumber">): string =>
  `${bankDisplayName(account.bankCode)} ${account.accountNumber}`;
