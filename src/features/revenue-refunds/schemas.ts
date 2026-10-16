import { z } from "zod";
import { sensitiveOtpSchema } from "@/lib/schemas/sensitive-otp";

export const refundStatusSchema = z.enum(["PENDING_APPROVAL", "PROCESSING", "ACCOUNTING_QUEUE", "SUCCEEDED", "FAILED", "REJECTED"]);
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
});

export const refundListResultSchema = z.object({ rows: z.array(revenueRefundSchema) });

export const refundFilterSchema = z.object({
  status: refundStatusSchema.optional(),
  orderId: z.uuid().optional(),
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
