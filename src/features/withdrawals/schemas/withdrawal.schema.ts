import { z } from "zod";
import { sensitiveOtpSchema } from "@/lib/schemas/sensitive-otp";

export const withdrawalStatusSchema = z.enum([
  "PENDING",
  "FUNDS_RESERVING",
  "FUNDS_RESERVED",
  "BANK_SUBMITTING",
  "BANK_ACCEPTED",
  "BANK_REJECTED",
  "RECONCILIATION_REQUIRED",
  "LEDGER_CAPTURING",
  "FUNDS_RELEASING",
  "APPROVED",
  "REJECTED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const withdrawalStatusGroupSchema = z.enum(["PENDING", "PROCESSING", "COMPLETED", "REJECTED", "RECONCILIATION"]);

export const withdrawalRequestTypeSchema = z.enum(["MANUAL", "AUTO_SWEEP"]);

/** Every field of the BE `MerchantWithdrawalPortalResponse`; ledger, gateway and actor fields are not sent. */
const withdrawalRecordSchema = z.object({
  id: z.uuid(),
  merchantId: z.uuid(),
  transactionCode: z.string().nullish(),
  requestType: withdrawalRequestTypeSchema,
  amount: z.number().int().nonnegative(),
  fee: z.number().int().nonnegative().nullish(),
  currency: z.string(),
  bankCode: z.string(),
  bankAccountNumber: z.string(),
  bankAccountName: z.string(),
  status: withdrawalStatusSchema,
  bankRefId: z.string().nullish(),
  reason: z.string().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

/** What the browser needs. BE already masks the account number, so it is passed through (masking again would hide it all). */
export const withdrawalResponseSchema = withdrawalRecordSchema.transform((record) => ({
  id: record.id,
  merchantId: record.merchantId,
  transactionCode: record.transactionCode ?? null,
  requestType: record.requestType,
  amount: record.amount,
  fee: record.fee ?? null,
  currency: record.currency,
  bankCode: record.bankCode,
  bankAccountMasked: record.bankAccountNumber,
  bankAccountName: record.bankAccountName,
  status: record.status,
  bankRefId: record.bankRefId ?? null,
  reason: record.reason ?? null,
  createdAt: record.createdAt ?? null,
  updatedAt: record.updatedAt ?? null,
}));

export const withdrawalFormSchema = z.object({
  bankAccountId: z.uuid("Chọn tài khoản ngân hàng nhận tiền"),
  amount: z.coerce
    .number<number>("Số tiền không hợp lệ")
    .int("Số tiền phải là số nguyên")
    .min(1, "Số tiền phải lớn hơn 0")
    .max(Number.MAX_SAFE_INTEGER, "Số tiền quá lớn"),
  reason: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").optional(),
});

/** The browser sends the key so a retried request replays the same BE record instead of making a second one. */
export const withdrawalCreateBodySchema = withdrawalFormSchema.extend({
  idempotencyKey: z.string().trim().min(1, "Thiếu mã chống gửi trùng").max(100),
  otp: sensitiveOtpSchema,
});

/** What the merchant can withdraw now. A limit is null when no ceiling applies. */
export const withdrawalBalanceSchema = z.object({
  merchantId: z.uuid(),
  availableBalance: z.number().int().nonnegative(),
  heldBalance: z.number().int().nonnegative(),
  dailyLimitRemaining: z.number().int().nonnegative().nullish().transform((value) => value ?? null),
  minimumAmount: z.number().int().nonnegative().nullish().transform((value) => value ?? null),
  maximumAmount: z.number().int().nonnegative().nullish().transform((value) => value ?? null),
});

export type WithdrawalStatus = z.infer<typeof withdrawalStatusSchema>;
export type WithdrawalStatusGroup = z.infer<typeof withdrawalStatusGroupSchema>;
export type WithdrawalBalance = z.infer<typeof withdrawalBalanceSchema>;
export type Withdrawal = z.infer<typeof withdrawalResponseSchema>;
export type WithdrawalFormValues = z.input<typeof withdrawalFormSchema>;
export type WithdrawalFormData = z.output<typeof withdrawalFormSchema>;
export type WithdrawalCreateBody = z.output<typeof withdrawalCreateBodySchema>;
