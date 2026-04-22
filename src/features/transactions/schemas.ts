import { z } from 'zod';

export const transactionFilterSchema = z.object({
  keyword: z.string().max(100).optional(),
  customerContact: z.string().max(100).optional(),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  subMerchantId: z.string().optional(),
  bankCode: z.string().optional(),
  createdFrom: z.date().nullable().optional(),
  createdTo: z.date().nullable().optional(),
});

export type TransactionFilterValues = z.infer<typeof transactionFilterSchema>;
