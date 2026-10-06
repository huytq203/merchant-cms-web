import { z } from "zod";

export const refundStatusSchema = z.enum(["pending", "approved", "rejected", "success", "cancelled"]);

export const refundSchema = z.object({
  id: z.string(),
  code: z.string(),
  transactionId: z.string(),
  transactionCode: z.string(),
  invoiceCode: z.string().nullable(),
  subMerchantId: z.string(),
  subMerchantName: z.string(),
  requestAmount: z.number(),
  actualAmount: z.number(),
  feeMb: z.number(),
  feeNm: z.number(),
  recipientName: z.string(),
  recipientCard: z.string().nullable(),
  createdBy: z.string().nullable(),
  reason: z.string().nullable(),
  status: refundStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const refundListResultSchema = z.object({
  rows: z.array(refundSchema),
  total: z.number().int().min(0),
});

const isoDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Thời gian không hợp lệ");

/** Query of the list route and of the page URL: everything that changes the response. */
export const refundListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    keyword: z.string().trim().max(100).optional(),
    invoiceCode: z.string().trim().max(100).optional(),
    transactionCode: z.string().trim().max(100).optional(),
    status: z.preprocess(
      (value) => typeof value === "string" ? value.split(",").filter(Boolean) : value,
      z.array(refundStatusSchema).max(5).optional(),
    ),
    subMerchantId: z.string().trim().max(100).optional(),
    createdFromDate: isoDateSchema.optional(),
    createdToDate: isoDateSchema.optional(),
  })
  .refine(
    ({ createdFromDate, createdToDate }) =>
      !createdFromDate || !createdToDate || Date.parse(createdFromDate) <= Date.parse(createdToDate),
    { message: "Ngày bắt đầu phải trước ngày kết thúc", path: ["createdToDate"] },
  );

/** Filter form values; dates stay `Date` until they are written to the URL. */
export const refundFilterSchema = z
  .object({
    keyword: z.string().trim(),
    invoiceCode: z.string().trim(),
    transactionCode: z.string().trim(),
    status: z.array(refundStatusSchema),
    subMerchantId: z.string().trim(),
    createdFromDate: z.date().nullable().optional(),
    createdToDate: z.date().nullable().optional(),
  })
  .refine(
    ({ createdFromDate, createdToDate }) => !createdFromDate || !createdToDate || createdFromDate <= createdToDate,
    { message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc", path: ["createdToDate"] },
  );

export type RefundFilterValue = z.infer<typeof refundFilterSchema>;
