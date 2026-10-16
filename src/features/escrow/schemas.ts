import { z } from "zod";

export const escrowStateSchema = z.enum(["NOT_CONFIGURED", "SHORT", "MET", "SURPLUS", "UNKNOWN"]);
export const escrowLedgerKindSchema = z.enum([
  "DEPOSIT_TRANSFER",
  "DEPOSIT_SUB_REVENUE",
  "WITHDRAWAL_SETOFF",
  "RETURN",
  "TERMINATION_DEDUCTION",
  "ADJUSTMENT",
]);

/** `GET /api/v1/merchant/escrow/{masterId}`. Amounts are null when the ledger could not be read (`UNKNOWN`). */
export const escrowStandingSchema = z.object({
  masterId: z.uuid(),
  masterName: z.string().nullish(),
  state: escrowStateSchema,
  requiredAmount: z.number(),
  balance: z.number().nullable(),
  shortfall: z.number().nullable(),
  surplus: z.number().nullable(),
  percent: z.number().int().nullable(),
  deadlineAt: z.string().nullable(),
  daysLeft: z.number().int().nullable(),
  overdue: z.boolean(),
  allowTransfer: z.boolean().nullable(),
  allowSetoff: z.boolean().nullable(),
});

export const escrowLedgerEntrySchema = z.object({
  seq: z.number().int(),
  kind: escrowLedgerKindSchema,
  amountDelta: z.number(),
  balanceAfter: z.number(),
  note: z.string().nullable(),
  occurredAt: z.string(),
});

/** One contributor; a null Sub is money the Master transferred itself. */
export const escrowContributionSchema = z.object({
  subMerchantId: z.uuid().nullable(),
  subCode: z.string().nullable(),
  subName: z.string().nullable(),
  amount: z.number(),
  byForm: z.record(z.string(), z.number()),
});
