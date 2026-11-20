import { z } from "zod";

/** One balance compartment, with the label and explanation the BE writes in Vietnamese. */
const balanceBucketSchema = z.object({
  code: z.string(),
  label: z.string(),
  amount: z.number(),
  explanation: z.string().nullish(),
});

const optionalAmount = z.number().nullish().transform((value) => value ?? null);
const optionalBucket = balanceBucketSchema.nullish().transform((value) => value ?? null);

/** `GET /api/v1/merchant/sub-balances/{subMerchantId}`, read live from the ledger on every call. */
export const subBalanceReportSchema = z.object({
  subMerchantId: z.uuid(),
  subCode: z.string().nullish(),
  subName: z.string().nullish(),
  revenueBalance: z.number(),
  availableBalance: z.number(),
  pendingSettlement: z.number(),
  frozenTotal: z.number(),
  available: balanceBucketSchema,
  pending: balanceBucketSchema,
  ruleHold: balanceBucketSchema,
  orderFreeze: balanceBucketSchema,
  withdrawalInProcess: balanceBucketSchema,
  waitingEscrow: balanceBucketSchema,
  asOf: z.string(),
  /**
   * GĐ6 (chi hộ): phần tách ngăn. BE chỉ gửi khi wallet-core đã trả số dư theo ngăn; vắng (BE cũ / chưa có ngăn) = null
   * và màn không vẽ các dòng này — "không biết" khác 0.
   */
  walletAvailable: optionalAmount,
  otherAvailable: optionalAmount,
  disbursementReserved: optionalAmount,
  overdraft: optionalAmount,
  /** Khả dụng ngăn khác trừ dư nợ Trả sau; có thể âm. */
  otherDisplayBalance: optionalAmount,
  availableWallet: optionalBucket,
  availableOther: optionalBucket,
  disbursementHold: optionalBucket,
  overdraftDebt: optionalBucket,
});
