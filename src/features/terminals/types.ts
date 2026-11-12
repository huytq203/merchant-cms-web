import type { z } from "zod";
import type { terminalDetailSchema, terminalSummarySchema } from "./schemas";

export type TerminalRow = z.infer<typeof terminalSummarySchema>;
export type TerminalDetail = z.infer<typeof terminalDetailSchema>;

export interface TerminalListFilter {
  page: number;
  pageSize: number;
  /** Subs the list is limited to; absent/empty = all Subs. BE intersects them with the session scope. */
  subMerchantIds?: string[];
  name?: string;
  status?: TerminalRow["status"];
  terminalType?: TerminalRow["terminalType"];
}

export interface TerminalListResult {
  rows: TerminalRow[];
  total: number;
}
