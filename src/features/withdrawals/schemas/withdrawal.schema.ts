import { z } from "zod";
import { sensitiveOtpSchema } from "@/lib/schemas/sensitive-otp";

export const withdrawalStatusSchema = z.enum([
  "PENDING",
  "FUNDS_RESERVING",
  "FUNDS_RESERVED",
  "BANK_SUBMITTING",
  "BANK_ACCEPTED",
  "BANK_REJECTED",
  // alias chuyển tiếp, gỡ sau 1 sprint: BE đã bỏ trạng thái này (thành PROCESSING), giữ để bản BE cũ vẫn parse được.
  "RECONCILIATION_REQUIRED",
  "LEDGER_CAPTURING",
  "FUNDS_RELEASING",
  "APPROVED",
  "REJECTED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const withdrawalStatusGroupSchema = z.enum(["PENDING", "PROCESSING", "COMPLETED", "REJECTED"]);

export const withdrawalRequestTypeSchema = z.enum(["MANUAL", "AUTO_SWEEP"]);

/** Every field of the BE `MerchantWithdrawalPortalResponse`; ledger, gateway and actor fields are not sent. */
const withdrawalRecordSchema = z.object({
  id: z.uuid(),
  merchantId: z.uuid(),
  transactionCode: z.string().nullish(),
  requestType: withdrawalRequestTypeSchema,
  amount: z.number().int().nonnegative(),
  fee: z.number().int().nonnegative().nullish(),
  /** Part of the amount set off against the Master's escrow (inside `amount`); missing from an older BE = 0. */
  setoffAmount: z.number().int().nonnegative().nullish(),
  /** What the bank pays out (BE `receivedAmount`): DEDUCT = amount − setoff − fee, ADD_ON = amount − setoff. */
  receivedAmount: z.number().int().nullish(),
  /** DEDUCT: fee inside the amount (every Sub request); ADD_ON: fee charged on top (old requests, column default). */
  payoutFeeMode: z.string().nullish(),
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
  setoffAmount: record.setoffAmount ?? 0,
  netReceived: record.receivedAmount ?? null,
  // Unknown or missing mode reads as ADD_ON, like BE (MerchantWithdrawalRequestMapper.receivedAmount) and the DB default.
  payoutFeeMode: record.payoutFeeMode === "DEDUCT" ? ("DEDUCT" as const) : ("ADD_ON" as const),
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
  /** Sent only after the merchant accepted a request that pays out nothing. */
  confirmZeroNet: z.boolean().optional(),
});

const nullableCount = z.number().int().nonnegative().nullish().transform((value) => value ?? null);

/**
 * What one Sub can withdraw now (`MerchantWithdrawalBalanceResponse`). `readyAmount` is the amount the next
 * request must carry; `netReceived` is `readyAmount - setoff - fee`. A limit is null when no ceiling applies.
 */
export const withdrawalBalanceSchema = z.object({
  subMerchantId: z.uuid(),
  availableBalance: z.number().int().nonnegative(),
  heldBalance: z.number().int().nonnegative(),
  pendingSettlement: z.number().int().nonnegative(),
  readyAmount: z.number().int().nonnegative(),
  setoff: z.number().int().nonnegative(),
  /**
   * null (11/11) when no account is chosen yet and the Sub has no default one (`blocker` = BANK_ACCOUNT_REQUIRED): the
   * fee depends on the account's bank, so BE does not guess it. `netReceived` is null together with it.
   */
  fee: z.number().int().nonnegative().nullable(),
  netReceived: z.number().int().nullable(),
  zeroNet: z.boolean(),
  dailyLimitRemaining: nullableCount,
  dailyCountRemaining: nullableCount,
  minimumAmount: nullableCount,
  maximumAmount: nullableCount,
  /**
   * Rút tự động (chốt 03/11/2026): true when the Sub's effective settlement mode is "Tự động theo chu kỳ". The system
   * makes the AUTO_SWEEP requests and BE refuses a manual one (5782), so the screen blocks it up front. A BE that does
   * not send the field yet is read as manual.
   */
  automaticSettlement: z.boolean().nullish().transform((value) => value ?? false),
  asOf: z.string(),
  /**
   * Cấn trừ ký quỹ (10/11/2026): how much the Master's escrow is short before this request, and what is still short
   * after its setoff (carried to the next withdrawal). 0 when set-off is off; null when nothing is ready (BE did not read
   * the escrow) or when the BE does not send them yet.
   */
  escrowShortfallBefore: nullableCount,
  escrowShortfallAfter: nullableCount,
  /**
   * Why BE would refuse a request although money is ready, e.g. `FEE_EXCEEDS_REMAINDER` (what is left after the setoff
   * cannot pay the fee) or `BANK_ACCOUNT_REQUIRED` (choose a receiving account first). `blockerMessage` is the Vietnamese sentence to show. Both null when nothing blocks.
   */
  blocker: z.string().nullish().transform((value) => value ?? null),
  blockerMessage: z.string().nullish().transform((value) => value ?? null),
});

/** The code is issued for one (account, amount) pair, so the browser names both. */
export const withdrawalOtpChallengeBodySchema = z.object({
  bankAccountId: z.uuid("Chọn tài khoản ngân hàng nhận tiền"),
  amount: z.number().int("Số tiền phải là số nguyên").min(1, "Số tiền phải lớn hơn 0").max(Number.MAX_SAFE_INTEGER),
});

export type WithdrawalOtpChallengeBody = z.infer<typeof withdrawalOtpChallengeBodySchema>;

export type WithdrawalStatus = z.infer<typeof withdrawalStatusSchema>;
export type WithdrawalStatusGroup = z.infer<typeof withdrawalStatusGroupSchema>;
export type WithdrawalBalance = z.infer<typeof withdrawalBalanceSchema>;
export type Withdrawal = z.infer<typeof withdrawalResponseSchema>;
export type WithdrawalFormValues = z.input<typeof withdrawalFormSchema>;
export type WithdrawalFormData = z.output<typeof withdrawalFormSchema>;
export type WithdrawalCreateBody = z.output<typeof withdrawalCreateBodySchema>;
