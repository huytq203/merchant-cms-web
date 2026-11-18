import type { z } from "zod";
import type {
  bankAccountSchema,
  bankAccountStatusSchema,
  bankUpdateResponseSchema,
  sensitiveOtpChallengeSchema,
} from "./schemas/bank-account.schema";
import type { bankAccountFormSchema } from "./schemas/bank-account-form.schema";

export type BankAccount = z.infer<typeof bankAccountSchema>;
export type BankAccountStatus = z.infer<typeof bankAccountStatusSchema>;
export type BankAssignedSub = BankAccount["assignedSubMerchants"][number];
export type BankUpdateResponse = z.infer<typeof bankUpdateResponseSchema>;
export type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;
export type BankOtpChallenge = z.infer<typeof sensitiveOtpChallengeSchema>;
/** ASSIGNED = TK đang gán ít nhất 1 Sub; UNASSIGNED = chưa gán Sub nào. */
export type BankAssignmentStatus = "ASSIGNED" | "UNASSIGNED";
export type BankAccountFilter = {
  page: number;
  pageSize: number;
  merchantId?: string;
  /** TK đang gán cho các Sub này (rỗng/không có = mọi TK); BE giao với phạm vi phiên. */
  subMerchantIds?: string[];
  assignmentStatus?: BankAssignmentStatus;
  accountStatus?: BankAccountStatus;
  /** Tên chủ TK / số TK / ngân hàng. */
  query?: string;
};
export type BankAccountList = { rows: BankAccount[]; total: number };
export type BankOtp = { otpSessionId: string; otp: string };
export type CreateBankRequest = Pick<BankAccountFormValues, "bankCode" | "accountNumber" | "accountName"> & {
  merchantId?: string;
  /** Sub đang dùng TK khác sẽ được BE chuyển ngay sang TK mới. */
  assignSubMerchantIds?: string[];
  branchName?: string;
  isDefault?: boolean;
  otp?: BankOtp;
};
export type UpdateBankRequest = Partial<Pick<BankAccountFormValues, "bankCode" | "accountNumber" | "accountName" | "branchName">> & {
  version: number;
  /** Danh sách Sub SAU khi lưu; không gửi = giữ nguyên, [] = gỡ hết. */
  assignSubMerchantIds?: string[];
  otp?: BankOtp;
};
