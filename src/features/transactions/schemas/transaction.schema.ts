import { z } from "zod";
import { bankCodeSchema, orderStatusSchema, paymentMethodSchema } from "@/features/orders/schemas/order.schema";

/**
 * A transaction is an order the merchant received money on (`GET /api/v1/merchant/transactions` reads
 * `merchant_orders`), so status, payment method and bank are the order enums of the BE.
 */
export const transactionStatusSchema = orderStatusSchema;
export { paymentMethodSchema };

/** `MerchantTransactionResponse` of flex.merchant. Times are Vietnam local time without an offset. */
export const transactionSchema = z.object({
  id: z.uuid(),
  transactionCode: z.string().nullish(),
  orderCode: z.string(),
  merchantId: z.uuid(),
  merchantCode: z.string().nullish(),
  merchantName: z.string().nullish(),
  subMerchantId: z.uuid().nullish(),
  subMerchantCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  terminalId: z.uuid().nullish(),
  terminalCode: z.string().nullish(),
  terminalName: z.string().nullish(),
  /** Orders stored before the column existed come back as `QR`. */
  paymentMethod: z.string(),
  bankCode: bankCodeSchema.nullish(),
  amount: z.number().int(),
  feeAmount: z.number().int().nullish(),
  netAmount: z.number().int().nullish(),
  payableAmount: z.number().int().nullish(),
  feeBearer: z.string().nullish(),
  currency: z.string().nullish(),
  status: transactionStatusSchema,
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

export const transactionListResultSchema = z.object({
  rows: z.array(transactionSchema),
  total: z.number().int().min(0),
});

/**
 * Query of the list route and of the page URL. Dates are calendar days (`yyyy-MM-dd`): the BE filters by
 * day and includes the whole last day. There is no customer phone filter: no payer phone is stored.
 */
export const transactionListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    keyword: z.string().trim().max(100).optional(),
    status: transactionStatusSchema.optional(),
    paymentMethod: paymentMethodSchema.optional(),
    subMerchantId: z.uuid().optional(),
    createdFrom: z.iso.date().optional(),
    createdTo: z.iso.date().optional(),
  })
  .refine(({ createdFrom, createdTo }) => !createdFrom || !createdTo || createdFrom <= createdTo, {
    message: "Ngày bắt đầu phải trước ngày kết thúc",
    path: ["createdTo"],
  });

/** Filter form values; dates stay `Date` until they are written to the URL. */
export const transactionFilterSchema = z
  .object({
    keyword: z.string().max(100).optional(),
    status: z.string().optional(),
    paymentMethod: z.string().optional(),
    subMerchantId: z.string().optional(),
    createdFrom: z.date().nullable().optional(),
    createdTo: z.date().nullable().optional(),
  })
  .refine(({ createdFrom, createdTo }) => !createdFrom || !createdTo || createdFrom <= createdTo, {
    message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc",
    path: ["createdTo"],
  });

export type TransactionFilterValues = z.infer<typeof transactionFilterSchema>;
