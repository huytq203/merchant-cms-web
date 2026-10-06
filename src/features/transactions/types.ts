import type { z } from "zod";
import type {
  cardTypeSchema,
  paymentMethodSchema,
  transactionListQuerySchema,
  transactionListResultSchema,
  transactionSchema,
  transactionStatusSchema,
  transactionTypeSchema,
} from "./schemas/transaction.schema";

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type CardType = z.infer<typeof cardTypeSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionListResult = z.infer<typeof transactionListResultSchema>;
export type TransactionListFilter = z.infer<typeof transactionListQuerySchema>;
