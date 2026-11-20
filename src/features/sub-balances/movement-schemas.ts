import { z } from "zod";
import { MAX_PAGE_SIZE } from "@/lib/schemas/pagination";

/** Category of one movement of the available balance (`type` of the Merchant Portal BE). */
const KNOWN_MOVEMENT_TYPES = ["ORDER", "WITHDRAWAL", "REFUND", "FREEZE", "ESCROW", "OTHER", "DISBURSEMENT", "TOPUP"] as const;
/**
 * `DISBURSEMENT` (chi hộ, trả lại chi hộ, NH hoàn trả lệnh chi) và `TOPUP` (nạp để chi hộ / hoàn tiền) là kiểu GĐ7. Kiểu BE thêm
 * sau mà FE chưa biết rơi về `OTHER` ("Điều chỉnh khác") thay vì làm vỡ cả trang; nhãn hiển thị vẫn lấy từ `label` của BE.
 */
export const movementTypeSchema = z.enum(KNOWN_MOVEMENT_TYPES).catch("OTHER");

/** Nguồn số dư của Sub (GĐ6): thu hộ ví, hoặc thu-chi hộ khác. Vắng = mọi nguồn như popup cũ. */
export const movementPocketSchema = z.enum(["WALLET", "OTHER"], "Nguồn số dư không hợp lệ (chỉ nhận Thu hộ ví hoặc Thu-chi hộ khác)");

/**
 * The chips ("Chi hộ" và "Nạp tiền" chỉ có nghĩa ở ngăn OTHER, FE chỉ hiện chip đó khi xem ngăn ấy): OTHER ("Điều chỉnh khác") is only reachable through "Tất cả". There is no "Ký quỹ" chip: the user decided
 * (10/11/2026) to list every escrow row under "Tất cả" — paying into the escrow from revenue (RESERVE_REVENUE /
 * ESCROW_FUNDING, which DOES take from the available balance), its return, and the escrow surplus paid back.
 */
export const movementTypeFilterSchema = z.enum(
  ["ALL", "ORDER", "WITHDRAWAL", "REFUND", "FREEZE", "DISBURSEMENT", "TOPUP"], "Loại biến động không hợp lệ",
);

/** One row of `GET /api/v1/merchant/sub-balances/{id}/movements`: a signed change of the available balance. */
export const movementSchema = z.object({
  id: z.string(),
  type: movementTypeSchema,
  kind: z.string(),
  label: z.string(),
  reference: z.string().nullish(),
  occurredAt: z.string(),
  amount: z.number(),
  /** Có thể ÂM ở ngăn thu-chi hộ khác: số hiển thị = khả dụng − dư nợ Trả sau (CẦN CHỐT 9 GĐ7). */
  balanceAfter: z.number(),
  /** Ngăn BE echo lại tham số `pocket`; null/vắng khi xem mọi ngăn hoặc BE cũ. */
  pocket: movementPocketSchema.nullish().catch(null),
  /** Phần dư nợ Trả sau của dòng và dư nợ sau dòng; chỉ ngăn OTHER và chỉ khi wallet-core có trường này. */
  overdraftDelta: z.number().nullish(),
  overdraftAfter: z.number().nullish(),
  /** Part of a withdrawal set off against the Master's escrow; only on the row that created the withdrawal, else null. */
  setoffAmount: z.number().nullish(),
});

/**
 * Totals of the chosen period over every type (not the chip), so opening + in − out = closing. In and out are gross: an
 * amount held then given back (rejected withdrawal, lifted freeze) counts on both sides. `totalIn`/`totalOut` are null
 * when the BE could not add them up (too many movements, or they did not reconcile: `totalsComplete` false); opening and
 * closing are still given. Only the first page carries the totals.
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
  pocket: movementPocketSchema.optional(),
  fromDate: z.iso.date("Từ ngày không hợp lệ").optional(),
  toDate: z.iso.date("Đến ngày không hợp lệ").optional(),
  page: z.coerce.number("Trang không hợp lệ").int("Trang không hợp lệ").min(1, "Trang không hợp lệ").default(1),
  size: z.coerce.number("Số dòng mỗi trang không hợp lệ").int("Số dòng mỗi trang không hợp lệ").min(1, "Số dòng mỗi trang không hợp lệ").max(MAX_PAGE_SIZE, "Số dòng mỗi trang tối đa 100").default(20),
});

/**
 * Query of the CSV export (`EXPORT_BALANCE`): same filters as the list, no paging. The date range is required and at most 93
 * days, but the BE owns that rule and answers in Vietnamese (the dialog also checks it so a bad range never leaves the browser).
 */
export const movementExportFilterSchema = movementFilterSchema.omit({ page: true, size: true });
