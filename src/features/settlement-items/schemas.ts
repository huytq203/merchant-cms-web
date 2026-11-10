import { z } from "zod";

export const settlementLineStatusSchema = z.enum(["PENDING_SETTLEMENT", "HELD", "READY", "IN_WITHDRAWAL", "PAID", "CANCELLED"]);
/** FREEZE/UNFREEZE: dòng đóng băng / gỡ băng theo lệnh (BE V89); chi tiết trả mọi dòng của item nên phải nhận cả hai. */
export const settlementLineKindSchema = z.enum(["FIRST_TRANCHE", "HOLD_TRANCHE", "REFUND", "FEE_REFUND", "FREEZE", "UNFREEZE"]);

/**
 * Nhóm "Trạng thái đợt" trên bộ lọc Portal (mục 11). "Đã vào lệnh rút" gộp IN_WITHDRAWAL và PAID; ba nhóm còn lại trùng
 * một trạng thái của BE. Server dịch nhóm sang danh sách trạng thái BE khi gọi.
 */
export const trancheGroupSchema = z.enum(["PENDING_SETTLEMENT", "READY", "IN_WITHDRAWAL", "HELD"]);

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ");

/**
 * The payment-date range is required by the BE; the end may not come before the start. Sub (mục 11: trống = mọi Sub trong
 * phạm vi phiên), Terminal và nhóm trạng thái đợt là tùy chọn.
 */
export const settlementFilterSchema = z
  .object({
    subMerchantId: z.uuid("Sub-merchant không hợp lệ").optional(),
    terminalId: z.uuid("Terminal không hợp lệ").optional(),
    trancheStatus: trancheGroupSchema.optional(),
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
  subMerchantCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
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
  holdReleaseAt: z.string().nullish(),
  // Mục 11: mã giao dịch FlexPay và terminal của đơn gốc; null khi chưa cấp mã / đơn không gắn terminal.
  transactionCode: z.string().nullish(),
  terminalId: z.uuid().nullish(),
  terminalCode: z.string().nullish(),
  terminalType: z.string().nullish(),
  terminalName: z.string().nullish(),
});

/** Phần của một Sub trong dòng tổng (khi xem Tất cả Sub); các phần cộng lại bằng dòng tổng. */
export const settlementSubTotalsSchema = z.object({
  subMerchantId: z.uuid(),
  subMerchantCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  count: z.number().int(),
  grossAmount: z.number(),
  feeAmount: z.number(),
  recognisedAmount: z.number(),
  firstTrancheAmount: z.number(),
  heldAmount: z.number(),
});

export const settlementTotalsSchema = z.object({
  count: z.number().int(),
  grossAmount: z.number(),
  feeAmount: z.number(),
  recognisedAmount: z.number(),
  firstTrancheAmount: z.number(),
  heldAmount: z.number(),
  // Bản BE trước MR A không gửi hai trường này: mặc định rỗng để màn vẫn chạy.
  bySub: z.array(settlementSubTotalsSchema).nullish().transform((value) => value ?? []),
  /** Doanh thu ghi nhận theo trạng thái đợt (khóa = trạng thái BE); tổng các giá trị = recognisedAmount. */
  byTrancheStatus: z.record(z.string(), z.number()).nullish().transform((value) => value ?? {}),
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
 * Detail of one item — schema RIÊNG, khớp record `Detail` của BE (mục 12, lỗi 10/11/2026): trước đây kế thừa schema dòng
 * danh sách nên đòi `firstTrancheStatus`, `firstTrancheWithdrawalId`, `holdTrancheStatus`, `holdTrancheWithdrawalId` mà BE
 * chi tiết không gửi → safeParse hỏng → "Hệ thống đang gặp sự cố". Trạng thái từng đợt đọc từ `lines`.
 * The BE shares the admin DTO, so it also sends `lotId` and the fee and hold-rule snapshots; they are left out here on
 * purpose and never reach the browser.
 */
export const settlementItemDetailSchema = z.object({
  id: z.uuid(),
  orderId: z.uuid(),
  orderCode: z.string(),
  subMerchantId: z.uuid(),
  paidAt: z.string(),
  tnEligibleAt: z.string().nullish(),
  holdReleaseAt: z.string().nullish(),
  grossAmount: z.number(),
  feeAmount: z.number(),
  recognisedAmount: z.number(),
  firstTrancheAmount: z.number(),
  heldAmount: z.number(),
  lines: z.array(settlementLineSchema),
  grossEqualsFeePlusRecognised: z.boolean(),
  recognisedEqualsTranches: z.boolean(),
  singleItemForPayment: z.boolean(),
  // MR A (BE) bổ sung; bản BE cũ không gửi.
  subMerchantCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  transactionCode: z.string().nullish(),
  terminalId: z.uuid().nullish(),
  terminalCode: z.string().nullish(),
  terminalType: z.string().nullish(),
  terminalName: z.string().nullish(),
});

export const settlementListResultSchema = z.object({
  rows: z.array(settlementItemSchema),
  total: z.number().int().min(0),
  totals: settlementTotalsSchema,
});
