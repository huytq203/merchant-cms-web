import type { z } from "zod";
import type {
  paymentMethodSchema,
  transactionListQuerySchema,
  transactionListResultSchema,
  transactionSchema,
  transactionStatusSchema,
} from "./schemas/transaction.schema";

export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionListResult = z.infer<typeof transactionListResultSchema>;
export type TransactionListFilter = z.infer<typeof transactionListQuerySchema>;
