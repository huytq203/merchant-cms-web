import { z } from "zod";

export const transactionStatusSchema = z.enum(["success", "pending", "failed", "refunded", "review", "cancelled", "created", "expired"]);
export const transactionTypeSchema = z.enum(["payment", "refund", "top_up", "withdrawal", "payout", "settlement"]);
export const cardTypeSchema = z.enum(["visa", "mastercard", "napas", "amex"]);
export const paymentMethodSchema = z.enum(["credit_card", "debit_card", "qr"]);

export const transactionSchema = z.object({
  id: z.string(),
  code: z.string(),
  invoiceCode: z.string().nullable(),
  type: transactionTypeSchema,
  cardType: cardTypeSchema,
  cardNumber: z.string(),
  cardHolderName: z.string(),
  amount: z.number(),
  currency: z.string(),
  fee: z.number(),
  netAmount: z.number(),
  subMerchantId: z.string(),
  subMerchantName: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  createdAt: z.string(),
  status: transactionStatusSchema,
  description: z.string(),
  referenceCode: z.string(),
  paymentMethod: paymentMethodSchema,
  bankCode: z.string(),
  responseCode: z.string(),
  responseMessage: z.string(),
});

export const transactionListResultSchema = z.object({
  rows: z.array(transactionSchema),
  total: z.number().int().min(0),
});

const isoDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Thời gian không hợp lệ");

/** Query of the list route and of the page URL: everything that changes the response. */
export const transactionListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    keyword: z.string().trim().max(100).optional(),
    customerContact: z.string().trim().max(100).optional(),
    status: transactionStatusSchema.optional(),
    type: transactionTypeSchema.optional(),
    paymentMethod: paymentMethodSchema.optional(),
    subMerchantId: z.string().trim().max(100).optional(),
    bankCode: z.string().trim().max(20).optional(),
    createdFromDate: isoDateSchema.optional(),
    createdToDate: isoDateSchema.optional(),
  })
  .refine(
    ({ createdFromDate, createdToDate }) =>
      !createdFromDate || !createdToDate || Date.parse(createdFromDate) <= Date.parse(createdToDate),
    { message: "Ngày bắt đầu phải trước ngày kết thúc", path: ["createdToDate"] },
  );

/** Filter form values; dates stay `Date` until they are written to the URL. */
export const transactionFilterSchema = z
  .object({
    keyword: z.string().max(100).optional(),
    customerContact: z.string().max(100).optional(),
    status: z.string().optional(),
    type: z.string().optional(),
    paymentMethod: z.string().optional(),
    subMerchantId: z.string().optional(),
    bankCode: z.string().optional(),
    createdFrom: z.date().nullable().optional(),
    createdTo: z.date().nullable().optional(),
  })
  .refine(({ createdFrom, createdTo }) => !createdFrom || !createdTo || createdFrom <= createdTo, {
    message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc",
    path: ["createdTo"],
  });

export type TransactionFilterValues = z.infer<typeof transactionFilterSchema>;
