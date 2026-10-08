import "server-only";

import type { BeResult } from "@/lib/be/client";
import { resolveModuleSource, unsupportedResult } from "@/lib/be/api-mode";
import { ok } from "@/lib/http/result";
import type {
  Refund,
  RefundListFilter,
  RefundListResult,
} from "@/features/refund/types/type";
import { REFUND_FIXTURES } from "./refund.fixtures";

export type RefundListQuery = RefundListFilter & { merchantId: string };

function includesText(
  value: string | null,
  search: string | undefined,
): boolean {
  return !search || (value ?? "").toLowerCase().includes(search.toLowerCase());
}

function isWithinRange(row: Refund, filter: RefundListFilter): boolean {
  const createdAt = Date.parse(row.createdAt);
  const from = filter.createdFromDate
    ? Date.parse(filter.createdFromDate)
    : -Infinity;
  const to = filter.createdToDate ? Date.parse(filter.createdToDate) : Infinity;
  return createdAt >= from && createdAt <= to;
}

// subMerchantId is not matched: fixture sub-merchant ids are not BE ids, so it would always give an empty list.
function matchesFilter(row: Refund, filter: RefundListFilter): boolean {
  return (
    (includesText(row.code, filter.keyword) ||
      includesText(row.transactionCode, filter.keyword)) &&
    includesText(row.transactionCode, filter.transactionCode) &&
    includesText(row.invoiceCode, filter.invoiceCode) &&
    (!filter.status?.length || filter.status.includes(row.status)) &&
    isWithinRange(row, filter)
  );
}

function queryFixtures(filter: RefundListFilter): RefundListResult {
  const matched = REFUND_FIXTURES.filter((row) => matchesFilter(row, filter));
  const start = (filter.page - 1) * filter.pageSize;
  return {
    rows: matched.slice(start, start + filter.pageSize),
    total: matched.length,
  };
}

/** The BE has no refund API yet: serves fixtures in development, otherwise NOT_IMPLEMENTED. */
export async function listRefunds(
  query: RefundListQuery,
): Promise<BeResult<RefundListResult>> {
  if (resolveModuleSource("refund") !== "fixture") return unsupportedResult();
  return ok(queryFixtures(query));
}
