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

// Form values (chứa Date objects)
export type TransactionFilterValues = z.infer<typeof transactionFilterSchema>;

// API params (chỉ string/number — không có Date)
export interface TransactionApiParams {
  keyword?: string;
  customerContact?: string;
  status?: string;
  paymentMethod?: string;
  subMerchantId?: string;
  bankCode?: string;
  createdFromDate?: string;
  createdToDate?: string;
}
