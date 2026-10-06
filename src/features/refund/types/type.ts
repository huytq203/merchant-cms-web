import type { z } from "zod";
import type {
  refundListQuerySchema,
  refundListResultSchema,
  refundSchema,
  refundStatusSchema,
} from "../schemas/Refund.schema";

export type RefundStatus = z.infer<typeof refundStatusSchema>;
export type Refund = z.infer<typeof refundSchema>;
export type RefundListResult = z.infer<typeof refundListResultSchema>;
export type RefundListFilter = z.infer<typeof refundListQuerySchema>;
