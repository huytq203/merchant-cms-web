import { z } from "zod";
import { subMerchantIdsCsv } from "@/features/sub-merchants/utils/sub-merchant-ids";
import { sensitiveOtpSchema } from "@/lib/schemas/sensitive-otp";

export const refundStatusSchema = z.enum(["PENDING_APPROVAL", "PROCESSING", "ACCOUNTING_QUEUE", "SUCCEEDED", "FAILED", "REJECTED", "CANCELLED"]);
export const payoutStatusSchema = z.enum(["PENDING", "PAID"]);

/**
 * One request of `GET /api/v1/merchant/revenue-refunds`. The BE does not send the beneficiary account
 * today; the schema strips it anyway so a later BE change cannot leak it into the list.
 */
export const revenueRefundSchema = z.object({
  id: z.uuid(),
  refundCode: z.string(),
  orderId: z.uuid(),
  subMerchantId: z.uuid(),
  amount: z.number(),
  fullRefund: z.boolean(),
  feeRefund: z.number().nullable(),
  cancelledHold: z.number().nullable(),
  fromAvailable: z.number().nullable(),
  status: refundStatusSchema,
  outcomeCode: z.string().nullable(),
  payoutStatus: payoutStatusSchema.nullable(),
  reason: z.string(),
  createdAt: z.string(),
  // Ai tạo và tạo từ đâu: quyết định nút Hủy (chỉ yêu cầu do Portal tạo; người chỉ có CREATE_REFUND chỉ hủy của chính mình).
  createdSource: z.enum(["ADMIN", "PORTAL"]).nullish(),
  createdBy: z.string().nullish(),
  // Nhãn BE trả kèm (mục 2·7): mã đơn hàng, mã giao dịch, Sub, terminal. nullish để một BE cũ chưa có vẫn đọc được.
  orderCode: z.string().nullish(),
  transactionCode: z.string().nullish(),
  subMerchantCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  terminalCode: z.string().nullish(),
  terminalType: z.string().nullish(),
});

/**
 * `GET /revenue-refunds/{id}`: các trường của dòng danh sách cộng thêm thông tin duyệt và chi tiền. BE không trả
 * payoutMode ở đây; mọi trường thêm đều nullish để yêu cầu chưa duyệt/chưa chi vẫn đọc được.
 */
export const revenueRefundDetailSchema = revenueRefundSchema.extend({
  approvedBy: z.string().nullish(),
  approvedAt: z.string().nullish(),
  decisionNote: z.string().nullish(),
  payoutAt: z.string().nullish(),
  payoutReference: z.string().nullish(),
});

/** `GET /revenue-refunds/summary`: đếm theo nhóm trạng thái + tổng tiền hoàn thành công. */
export const refundSummarySchema = z.object({
  total: z.number(),
  pending: z.number(),
  processing: z.number(),
  succeeded: z.number(),
  failed: z.number(),
  cancelled: z.number(),
  succeededAmount: z.number(),
});

/** Nhóm trạng thái của dải đếm; bấm một nhóm = lọc theo các trạng thái của nhóm (xem constants/refund-status). */
export const refundGroupSchema = z.enum(["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELLED"]);
export const refundPeriodSchema = z.enum(["7d", "30d", "custom"]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const refundListResultSchema = z.object({ rows: z.array(revenueRefundSchema) });

/**
 * Bộ lọc của màn Hoàn tiền (nằm trên URL). Kỳ mặc định là 7 ngày gần nhất; `from`/`to` chỉ có nghĩa khi
 * `period=custom`. `status` đơn lẻ giữ lại cho liên kết cũ; `orderId` đến từ màn Đơn hàng.
 */
export const refundFilterSchema = z.object({
  status: refundStatusSchema.optional(),
  orderId: z.uuid().optional(),
  q: z.string().trim().max(100).optional(),
  group: refundGroupSchema.optional(),
  /** Nhiều Sub: rỗng = tất cả Sub trong phạm vi. */
  subMerchantIds: z.array(z.uuid()).max(500).optional(),
  period: refundPeriodSchema.optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

/** Tham số gửi BE (đã đổi kỳ thành ngày): browser → route handler → BE dùng chung một dạng. */
export const refundQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  statuses: z.string().regex(/^[A-Z_]+(,[A-Z_]+)*$/).optional(),
  orderId: z.uuid().optional(),
  /** Danh sách Sub nối dấu phẩy (đã ở dạng gửi BE). */
  subMerchantIds: subMerchantIdsCsv.optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

/** Same rules the BE applies, so the user sees them before spending an OTP. */
export const createRefundFormSchema = z.object({
  amount: z.coerce.number().int("Số tiền phải là số nguyên").positive("Số tiền hoàn phải lớn hơn 0"),
  reason: z.string().trim().min(10, "Lý do hoàn tiền phải từ 10 đến 500 ký tự").max(500, "Lý do hoàn tiền phải từ 10 đến 500 ký tự"),
  beneficiaryBankCode: z.string().trim().min(1, "Vui lòng chọn ngân hàng nhận"),
  beneficiaryAccountNumber: z.string().trim().regex(/^\d{6,20}$/, "Số tài khoản gồm 6 đến 20 chữ số"),
  beneficiaryAccountName: z.string().trim().min(1, "Vui lòng nhập tên chủ tài khoản").max(100, "Tên chủ tài khoản tối đa 100 ký tự").transform((value) => value.toUpperCase()),
});

export const createRefundBodySchema = createRefundFormSchema.extend({
  amount: z.number().int().positive(),
  orderId: z.uuid(),
  sensitiveOtp: sensitiveOtpSchema,
});

export const createOtpBodySchema = z.object({ orderId: z.uuid(), amount: z.number().int().positive() });

export const approveRefundBodySchema = z.object({ sensitiveOtp: sensitiveOtpSchema });
