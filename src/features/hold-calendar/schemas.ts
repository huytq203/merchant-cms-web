import { z } from "zod";

/** The only ranges the BE accepts; any other value makes it answer 500, so the FE never sends one. */
export const holdRangeSchema = z.enum(["DAYS_7", "DAYS_30", "DAYS_90", "ALL"]);

const holdDaySchema = z.object({
  date: z.string(),
  weekday: z.string(),
  count: z.number().int(),
  amount: z.number(),
  cumulativeReleased: z.number(),
  remainingHeld: z.number(),
});

/** Số khoản và tổng tiền của một nhóm khoản đã qua (mục 14). */
const pastTotalSchema = z.object({ count: z.number().int(), amount: z.number() });

/**
 * `GET /api/v1/merchant/hold-calendar/{subMerchantId}?range=` (hoặc `/hold-calendar?range=` cho mọi Sub); overdue holds
 * still held are folded into today's row. `pastFrom`, `releasedInPast`, `cancelledByRefund` (mục 14): khoản đã giải phóng /
 * hủy do hoàn tiền trong cửa sổ nhìn lùi cùng độ dài kỳ; null khi BE chưa có (bản trước MR A).
 */
export const holdCalendarSchema = z.object({
  scope: z.string().nullish(),
  range: holdRangeSchema,
  totalHeld: z.number(),
  releasedInPeriod: z.number(),
  heldAfterPeriod: z.number(),
  peak: z.object({ date: z.string(), amount: z.number() }).nullable(),
  days: z.array(holdDaySchema),
  reconciles: z.boolean(),
  ledgerHeld: z.number().nullable(),
  notes: z.array(z.string()),
  asOf: z.string(),
  pastFrom: z.string().nullish(),
  releasedInPast: pastTotalSchema.nullish().transform((value) => value ?? null),
  cancelledByRefund: pastTotalSchema.nullish().transform((value) => value ?? null),
});

/** Trạng thái một khoản tạm giữ, suy ra ở BE như danh sách tạm giữ Admin. */
export const holdItemStateSchema = z.enum(["HOLDING", "RELEASED", "RELEASED_EARLY", "CANCELLED_BY_REFUND"]);

/**
 * Một khoản của `GET /api/v1/merchant/hold-calendar/{sub}/items` (mục 14). `orderCode` = Mã đơn hàng, `transactionCode`
 * = Mã giao dịch. `eventAt`: mốc giải phóng dự kiến (quá hạn còn giữ = lúc xem), lúc giải phóng thực tế hoặc lúc hủy.
 * `releasedAt` là lúc ghi lệnh giải phóng ở FlexPay.
 */
export const holdItemSchema = z.object({
  lineId: z.uuid(),
  itemId: z.uuid(),
  orderId: z.uuid(),
  orderCode: z.string(),
  transactionCode: z.string().nullish(),
  subMerchantId: z.uuid(),
  subMerchantCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  terminalId: z.uuid().nullish(),
  terminalCode: z.string().nullish(),
  terminalType: z.string().nullish(),
  terminalName: z.string().nullish(),
  paidAt: z.string(),
  heldAmount: z.number(),
  frozenAmount: z.number(),
  holdReleaseAt: z.string(),
  state: holdItemStateSchema,
  releasedAt: z.string().nullish(),
  cancelledAt: z.string().nullish(),
  eventAt: z.string(),
  earlyReleaseId: z.uuid().nullish(),
});

/** Trang khoản tạm giữ đã chuẩn hóa cho trình duyệt. */
export const holdItemPageSchema = z.object({ rows: z.array(holdItemSchema), total: z.number().int().min(0) });
