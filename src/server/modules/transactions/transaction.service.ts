import "server-only";

import type { BeResult } from "@/lib/be/client";
import { resolveModuleSource, unsupportedResult } from "@/lib/be/api-mode";
import { ok } from "@/lib/http/result";
import type {
  Transaction,
  TransactionListFilter,
  TransactionListResult,
} from "@/features/transactions/types";
import { TRANSACTION_FIXTURES } from "./transaction.fixtures";

export type TransactionListQuery = TransactionListFilter & {
  merchantId: string;
};

function includesText(value: string, search: string | undefined): boolean {
  return !search || value.toLowerCase().includes(search.toLowerCase());
}

function isWithinRange(
  row: Transaction,
  filter: TransactionListFilter,
): boolean {
  const createdAt = Date.parse(row.createdAt);
  const from = filter.createdFromDate
    ? Date.parse(filter.createdFromDate)
    : -Infinity;
  const to = filter.createdToDate ? Date.parse(filter.createdToDate) : Infinity;
  return createdAt >= from && createdAt <= to;
}

// subMerchantId is not matched: fixture sub-merchant ids are not BE ids, so it would always give an empty list.
function matchesFilter(
  row: Transaction,
  filter: TransactionListFilter,
): boolean {
  return (
    (includesText(row.code, filter.keyword) ||
      includesText(row.invoiceCode ?? "", filter.keyword)) &&
    (!filter.type || row.type === filter.type) &&
    includesText(row.customerPhone, filter.customerContact) &&
    (!filter.status || row.status === filter.status) &&
    (!filter.paymentMethod || row.paymentMethod === filter.paymentMethod) &&
    (!filter.bankCode || row.bankCode === filter.bankCode) &&
    isWithinRange(row, filter)
  );
}

function queryFixtures(filter: TransactionListFilter): TransactionListResult {
  const matched = TRANSACTION_FIXTURES.filter((row) =>
    matchesFilter(row, filter),
  );
  const start = (filter.page - 1) * filter.pageSize;
  return {
    rows: matched.slice(start, start + filter.pageSize),
    total: matched.length,
  };
}

/** The BE has no transaction API yet: serves fixtures in development, otherwise NOT_IMPLEMENTED. */
export async function listTransactions(
  query: TransactionListQuery,
): Promise<BeResult<TransactionListResult>> {
  if (resolveModuleSource("transactions") !== "fixture")
    return unsupportedResult();
  return ok(queryFixtures(query));
}
