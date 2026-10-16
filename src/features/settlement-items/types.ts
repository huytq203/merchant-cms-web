import type { z } from "zod";
import type {
  settlementItemDetailSchema,
  settlementItemSchema,
  settlementLineKindSchema,
  settlementLineStatusSchema,
  settlementListResultSchema,
  settlementTotalsSchema,
} from "./schemas";

export type SettlementItem = z.infer<typeof settlementItemSchema>;
export type SettlementItemDetail = z.infer<typeof settlementItemDetailSchema>;
export type SettlementTotals = z.infer<typeof settlementTotalsSchema>;
export type SettlementListResult = z.infer<typeof settlementListResultSchema>;
export type SettlementLineStatus = z.infer<typeof settlementLineStatusSchema>;
export type SettlementLineKind = z.infer<typeof settlementLineKindSchema>;

/** The URL filter; the Sub is optional until the server picks the session's first one. */
export interface SettlementFilter {
  subMerchantId?: string;
  paidFrom: string;
  paidTo: string;
  page: number;
  pageSize: number;
}

export type ResolvedSettlementFilter = SettlementFilter & { subMerchantId: string };
