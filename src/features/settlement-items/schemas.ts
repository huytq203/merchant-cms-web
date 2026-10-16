import { z } from "zod";

export const settlementLineStatusSchema = z.enum(["PENDING_SETTLEMENT", "HELD", "READY", "IN_WITHDRAWAL", "PAID", "CANCELLED"]);
export const settlementLineKindSchema = z.enum(["FIRST_TRANCHE", "HOLD_TRANCHE", "REFUND", "FEE_REFUND"]);

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ");

/** Sub and payment-date range are required by the BE; the end may not come before the start. */
export const settlementFilterSchema = z
  .object({
    subMerchantId: z.uuid("Vui lòng chọn Sub-merchant"),
    paidFrom: day,
    paidTo: day,
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
  })
  .refine((value) => value.paidTo >= value.paidFrom, { message: "Ngày kết thúc không được trước ngày bắt đầu", path: ["paidTo"] });

/** A row of `GET /api/v1/merchant/settlement-items`: one paid transaction split into two tranches. */
export const settlementItemSchema = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  orderCode: z.string(),
  subMerchantId: z.uuid(),
  paidAt: z.string(),
  grossAmount: z.number(),
  feeAmount: z.number(),
  recognisedAmount: z.number(),
  firstTrancheAmount: z.number(),
  heldAmount: z.number(),
  firstTrancheStatus: settlementLineStatusSchema.nullable(),
  firstTrancheWithdrawalId: z.uuid().nullable(),
  holdTrancheStatus: settlementLineStatusSchema.nullable(),
  holdTrancheWithdrawalId: z.uuid().nullable(),
  holdReleaseAt: z.string(),
});

export const settlementTotalsSchema = z.object({
  count: z.number().int(),
  grossAmount: z.number(),
  feeAmount: z.number(),
  recognisedAmount: z.number(),
  firstTrancheAmount: z.number(),
  heldAmount: z.number(),
});

const settlementLineSchema = z.object({
  id: z.string(),
  kind: settlementLineKindSchema,
  amount: z.number(),
  status: settlementLineStatusSchema,
  withdrawalRequestId: z.uuid().nullable(),
  updatedAt: z.string().nullish(),
});

/**
 * Detail of one item. The BE shares the admin DTO, so it also sends `lotId` and the fee and hold-rule
 * snapshots; they are left out here on purpose and never reach the browser.
 */
export const settlementItemDetailSchema = settlementItemSchema.extend({
  tnEligibleAt: z.string().nullish(),
  lines: z.array(settlementLineSchema),
  grossEqualsFeePlusRecognised: z.boolean(),
  recognisedEqualsTranches: z.boolean(),
  singleItemForPayment: z.boolean(),
});

export const settlementListResultSchema = z.object({
  rows: z.array(settlementItemSchema),
  total: z.number().int().min(0),
  totals: settlementTotalsSchema,
});
