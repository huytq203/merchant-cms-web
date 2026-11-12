import type { z } from "zod";
import type { bankAccountSchema, bankChangeRequestSchema, bankUpdateResponseSchema, sensitiveOtpChallengeSchema } from "./schemas/bank-account.schema";
import type { bankAccountFormSchema } from "./schemas/bank-account-form.schema";

export type BankAccount = z.infer<typeof bankAccountSchema>;
export type BankChangeRequest = z.infer<typeof bankChangeRequestSchema>;
export type BankUpdateResponse = z.infer<typeof bankUpdateResponseSchema>;
export type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;
export type BankOtpChallenge = z.infer<typeof sensitiveOtpChallengeSchema>;
export type BankAccountFilter = {
  page: number;
  pageSize: number;
  merchantId?: string;
  /** Subs the list is limited to (empty/absent = all Subs); BE intersects them with the session scope. */
  subMerchantIds?: string[];
  linkStatus?: BankAccount["linkStatus"];
  status?: BankAccount["status"];
};
export type BankAccountList = { rows: BankAccount[]; total: number };
export type BankOtp = { otpSessionId: string; otp: string };
export type CreateBankRequest = Pick<BankAccountFormValues, "bankCode" | "accountNumber" | "accountName"> & {
  merchantId?: string;
  subMerchantId?: string;
  branchName?: string;
  isDefault?: boolean;
  otp?: BankOtp;
};
export type UpdateBankRequest = Partial<Pick<BankAccountFormValues, "bankCode" | "accountNumber" | "accountName" | "branchName" | "status" | "reason">> & {
  version: number;
  otp?: BankOtp;
};
