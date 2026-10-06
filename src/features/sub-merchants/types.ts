import type { z } from "zod";

import type { subMerchantDetailSchema, subMerchantSummarySchema } from "./schemas";

export type SubMerchantRow = z.infer<typeof subMerchantSummarySchema>;
export type SubMerchantDetail = z.infer<typeof subMerchantDetailSchema>;
export type SubMerchantStatus = SubMerchantRow["status"];
export type LockSource = NonNullable<SubMerchantRow["lockSource"]>;

export interface SubMerchantListFilter {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: SubMerchantRow["status"];
}

export interface SubMerchantListResult {
  rows: SubMerchantRow[];
  total: number;
}
