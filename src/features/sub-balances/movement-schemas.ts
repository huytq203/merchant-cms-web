import { z } from "zod";
import { MAX_PAGE_SIZE } from "@/lib/schemas/pagination";

/** Category of one movement of the available balance (`type` of the Merchant Portal BE). */
export const movementTypeSchema = z.enum(["ORDER", "WITHDRAWAL", "REFUND", "FREEZE", "ESCROW", "OTHER"]);

/**
 * The chips: OTHER ("Điều chỉnh khác") is only reachable through "Tất cả". There is no "Ký quỹ" chip (10/11/2026): paying
 * into the escrow does not go through the available balance, and an escrow return (type ESCROW) is listed under "Tất cả".
 */
export const movementTypeFilterSchema = z.enum(["ALL", "ORDER", "WITHDRAWAL", "REFUND", "FREEZE"], "Loại biến động không hợp lệ");

/** One row of `GET /api/v1/merchant/sub-balances/{id}/movements`: a signed change of the available balance. */
export const movementSchema = z.object({
  id: z.string(),
  type: movementTypeSchema,
  kind: z.string(),
  label: z.string(),
  reference: z.string().nullish(),
  occurredAt: z.string(),
  amount: z.number(),
  balanceAfter: z.number(),
  /** Part of a withdrawal set off against the Master's escrow; only on the row that created the withdrawal, else null. */
  setoffAmount: z.number().nullish(),
});

/**
 * Totals of the chosen period over every type (not the chip), so opening + in − out = closing. `totalIn`/`totalOut` are
 * null when the period has too many movements to add up (`totalsComplete` false); opening and closing are still exact.
 */
export const movementSummarySchema = z.object({
  openingBalance: z.number(),
  totalIn: z.number().nullable(),
  totalOut: z.number().nullable(),
  closingBalance: z.number(),
  totalsComplete: z.boolean(),
});

/** A detail line is rendered generically; the BE decides the labels, the order and which amounts are signed. */
export const movementLineSchema = z.object({
  label: z.string(),
  text: z.string().nullish(),
  amount: z.number().nullish(),
  signed: z.boolean().nullish(),
  note: z.string().nullish(),
  emphasis: z.boolean().nullish(),
  indent: z.boolean().nullish(),
});

/** Where the business page of the movement is; null when the BE could not resolve it. */
export const movementLinkSchema = z.object({
  type: z.string(),
  id: z.string().nullish(),
  code: z.string().nullish(),
});

/** `GET /api/v1/merchant/sub-balances/{id}/movements/{operationId}`. */
export const movementDetailSchema = movementSchema.extend({
  lines: z.array(movementLineSchema),
  link: movementLinkSchema.nullish(),
});

/** What the list route answers: rows of the page, the total over all pages and the period totals (null from an older BE). */
export const movementListResultSchema = z.object({
  rows: z.array(movementSchema),
  total: z.number().int().nonnegative(),
  summary: movementSummarySchema.nullish(),
});

/** Query of the list route. `page` is 1-based like every flex.merchant portal list; dates are Vietnam calendar days. */
export const movementFilterSchema = z.object({
  type: movementTypeFilterSchema.default("ALL"),
  fromDate: z.iso.date("Từ ngày không hợp lệ").optional(),
  toDate: z.iso.date("Đến ngày không hợp lệ").optional(),
  page: z.coerce.number("Trang không hợp lệ").int("Trang không hợp lệ").min(1, "Trang không hợp lệ").default(1),
  size: z.coerce.number("Số dòng mỗi trang không hợp lệ").int("Số dòng mỗi trang không hợp lệ").min(1, "Số dòng mỗi trang không hợp lệ").max(MAX_PAGE_SIZE, "Số dòng mỗi trang tối đa 100").default(20),
});
