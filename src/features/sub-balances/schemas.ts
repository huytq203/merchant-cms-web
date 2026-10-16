import { z } from "zod";

/** One balance compartment, with the label and explanation the BE writes in Vietnamese. */
const balanceBucketSchema = z.object({
  code: z.string(),
  label: z.string(),
  amount: z.number(),
  explanation: z.string().nullish(),
});

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
});
