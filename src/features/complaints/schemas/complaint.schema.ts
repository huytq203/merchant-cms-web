import { z } from "zod";

export const complaintStatusSchema = z.enum(["pending", "processing", "resolved", "rejected"]);
export const complaintSourceSchema = z.enum(["customer", "gateway", "merchant"]);

export const complaintMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["admin", "merchant"]),
  senderName: z.string(),
  content: z.string(),
  time: z.string(),
});

export const complaintSchema = z.object({
  id: z.string(),
  ticketCode: z.string(),
  transactionId: z.string().nullable(),
  transactionCode: z.string().nullable(),
  subMerchantName: z.string(),
  reason: z.string(),
  source: complaintSourceSchema,
  content: z.string(),
  status: complaintStatusSchema,
  deadline: z.string().nullable(),
  note: z.string().nullable(),
  lastUpdatedAt: z.string().nullable(),
  createdAt: z.string(),
  messages: z.array(complaintMessageSchema),
});

export const complaintListResultSchema = z.object({
  rows: z.array(complaintSchema),
  total: z.number().int().min(0),
});

const isoDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Thời gian không hợp lệ");

/** Query of the list route and of the page URL: everything that changes the response. */
export const complaintListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    keyword: z.string().trim().max(100).optional(),
    status: complaintStatusSchema.optional(),
    source: complaintSourceSchema.optional(),
    createdFromDate: isoDateSchema.optional(),
    createdToDate: isoDateSchema.optional(),
  })
  .refine(
    ({ createdFromDate, createdToDate }) =>
      !createdFromDate || !createdToDate || Date.parse(createdFromDate) <= Date.parse(createdToDate),
    { message: "Ngày bắt đầu phải trước ngày kết thúc", path: ["createdToDate"] },
  );

/** Filter form values; dates stay `Date` until they are written to the URL. */
export const complaintFilterSchema = z
  .object({
    keyword: z.string().optional(),
    fromDate: z.date().nullable().optional(),
    toDate: z.date().nullable().optional(),
    source: z.string().optional(),
    status: z.string().optional(),
  })
  .refine(({ fromDate, toDate }) => !fromDate || !toDate || fromDate <= toDate, {
    message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc",
    path: ["toDate"],
  });

export type ComplaintFilterValues = z.infer<typeof complaintFilterSchema>;
