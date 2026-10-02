import { z } from 'zod';

export const refundFilterSchema = z.object({
  keyword: z.string().trim(),
  invoiceCode: z.string().trim(),
  transactionCode: z.string().trim(),
  status: z.string().trim(),
  subMerchantId: z.string().trim(),
  createdFromDate: z.date().nullable().optional(),
  createdToDate: z.date().nullable().optional(),
});
export type RefundFilterValue = z.infer<typeof refundFilterSchema>;
