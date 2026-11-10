import type { z } from "zod";
import type {
  settlementItemDetailSchema,
  settlementItemSchema,
  settlementLineKindSchema,
  settlementLineStatusSchema,
  settlementListResultSchema,
  settlementSubTotalsSchema,
  settlementTotalsSchema,
  trancheGroupSchema,
} from "./schemas";

export type SettlementItem = z.infer<typeof settlementItemSchema>;
export type SettlementItemDetail = z.infer<typeof settlementItemDetailSchema>;
export type SettlementTotals = z.infer<typeof settlementTotalsSchema>;
export type SettlementListResult = z.infer<typeof settlementListResultSchema>;
export type SettlementLineStatus = z.infer<typeof settlementLineStatusSchema>;
export type SettlementLineKind = z.infer<typeof settlementLineKindSchema>;
export type SettlementSubTotals = z.infer<typeof settlementSubTotalsSchema>;
export type TrancheGroup = z.infer<typeof trancheGroupSchema>;

/**
 * The URL filter. Mục 11: không có Sub = mọi Sub trong phạm vi phiên (mặc định khi vào màn); Terminal và nhóm trạng thái
 * đợt là tùy chọn.
 */
export interface SettlementFilter {
  subMerchantId?: string;
  terminalId?: string;
  trancheStatus?: TrancheGroup;
  paidFrom: string;
  paidTo: string;
  page: number;
  pageSize: number;
}

/** Không còn ép chọn Sub: bộ lọc đã đọc từ URL chính là bộ lọc gửi đi. */
export type ResolvedSettlementFilter = SettlementFilter;
