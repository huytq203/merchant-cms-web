import type { z } from "zod";
import type { createRefundBodySchema, createRefundFormSchema, refundFilterSchema, refundStatusSchema, revenueRefundSchema } from "./schemas";

export type RevenueRefund = z.infer<typeof revenueRefundSchema>;
export type RefundStatus = z.infer<typeof refundStatusSchema>;
export type RefundFilter = z.infer<typeof refundFilterSchema>;
export type CreateRefundForm = z.output<typeof createRefundFormSchema>;
export type CreateRefundBody = z.infer<typeof createRefundBodySchema>;
