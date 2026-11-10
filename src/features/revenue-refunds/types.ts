import type { z } from "zod";
import type {
  createRefundBodySchema,
  createRefundFormSchema,
  refundFilterSchema,
  refundGroupSchema,
  refundPeriodSchema,
  refundQuerySchema,
  refundStatusSchema,
  refundSummarySchema,
  revenueRefundSchema,
} from "./schemas";

export type RevenueRefund = z.infer<typeof revenueRefundSchema>;
export type RefundStatus = z.infer<typeof refundStatusSchema>;
export type RefundFilter = z.infer<typeof refundFilterSchema>;
export type CreateRefundForm = z.output<typeof createRefundFormSchema>;
export type CreateRefundBody = z.infer<typeof createRefundBodySchema>;
export type RefundGroup = z.infer<typeof refundGroupSchema>;
export type RefundPeriod = z.infer<typeof refundPeriodSchema>;
export type RefundQuery = z.infer<typeof refundQuerySchema>;
export type RefundSummary = z.infer<typeof refundSummarySchema>;
