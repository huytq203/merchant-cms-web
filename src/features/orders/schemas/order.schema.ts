import { z } from "zod";

export const orderStatusSchema = z.enum([
  "PENDING", "ACTIVE", "PAYMENT_CONFIRMED", "CREDIT_PENDING", "CREDIT_POSTING",
  "CREDIT_RECONCILIATION_REQUIRED" /* alias chuyển tiếp, gỡ sau 1 sprint: BE đã bỏ, thành CREDIT_POSTING */, "SUCCESS", "FAILED", "EXPIRED", "CANCELLED",
]);
export const bankCodeSchema = z.enum(["VPB", "VCB"], "Chọn ngân hàng nhận tiền");
export const paymentMethodSchema = z.enum(
  ["QR", "DOMESTIC_CARD", "INTERNATIONAL_CARD", "LINKED_WALLET", "VIRTUAL_ACCOUNT"],
  "Chọn phương thức thanh toán",
);
export const virtualAccountSchema = z.object({
  virtualAccId: z.string().nullish(),
  virtualAccountNo: z.string().nullish(),
  virtualAccountName: z.string().nullish(),
  qrCode: z.string().nullish(),
});

export const orderResponseSchema = z.object({
  id: z.uuid(),
  merchantId: z.uuid(),
  merchantName: z.string().nullish(),
  merchantCode: z.string().nullish(),
  subMerchantId: z.uuid().nullish(),
  subMerchantCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  terminalId: z.uuid().nullish(),
  terminalCode: z.string().nullish(),
  terminalName: z.string().nullish(),
  acceptedPaymentMethod: z.string().nullish(),
  orderCode: z.string(),
  orderDescription: z.string().nullish(),
  netAmount: z.number().int().nullish(),
  amount: z.number().int().nonnegative(),
  currency: z.string(),
  status: orderStatusSchema,
  bankCode: bankCodeSchema.nullish(),
  expiredAt: z.string().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  virtualAccount: virtualAccountSchema.nullish(),
  qrCode: z.string().nullish(),
  qrCodeImage: z.string().nullish(),
  transactionCode: z.string().nullish(),
  feeAmount: z.number().int().nullish(),
  /** Thời gian khách thanh toán thành công (giờ VN, không múi giờ); null khi chưa thanh toán. */
  paidAt: z.string().nullish(),
});

export const orderFormSchema = z.object({
  orderCode: z.string().trim().min(1, "Nhập mã đơn hàng").max(100, "Mã đơn hàng tối đa 100 ký tự"),
  orderDescription: z.string().trim().max(500, "Nội dung tối đa 500 ký tự").optional(),
  amount: z.coerce
    .number<number>("Số tiền không hợp lệ")
    .int("Số tiền phải là số nguyên")
    .min(1, "Số tiền phải lớn hơn 0")
    .max(Number.MAX_SAFE_INTEGER, "Số tiền quá lớn"),
  currency: z.literal("VND").default("VND"),
  bankCode: bankCodeSchema,
  paymentMethod: paymentMethodSchema.default("QR"),
  expiryMinutes: z.coerce.number<number>().int().min(0).optional(),
  subMerchantId: z.uuid().optional(),
  terminalId: z.uuid().optional(),
});

export type Order = z.infer<typeof orderResponseSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type OrderFormValues = z.input<typeof orderFormSchema>;
export type OrderFormData = z.output<typeof orderFormSchema>;
