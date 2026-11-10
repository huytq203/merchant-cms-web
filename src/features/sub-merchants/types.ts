import type { z } from "zod";

import type { subMerchantDetailSchema, subMerchantSummarySchema } from "./schemas";

export type SubMerchantRow = z.infer<typeof subMerchantSummarySchema>;
export type SubMerchantDetail = z.infer<typeof subMerchantDetailSchema>;
export type SubMerchantStatus = SubMerchantRow["status"];
export type LockSource = NonNullable<SubMerchantRow["lockSource"]>;

export interface SubMerchantListFilter {
  page: number;
  pageSize: number;
  /** Matches part of the code. */
  code?: string;
  /** Matches part of the name. */
  name?: string;
  status?: SubMerchantRow["status"];
  /** Only the outlets of this merchant; the BE still bounds them to the session's scope. */
  merchantId?: string;
  /** `true` = only Subs that have a receiving account, `false` = only those without one. */
  hasBankAccount?: boolean;
  /** Created-date range, `yyyy-MM-dd`, both ends included. */
  createdFrom?: string;
  createdTo?: string;
}

export interface SubMerchantListResult {
  rows: SubMerchantRow[];
  total: number;
}
