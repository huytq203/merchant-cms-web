import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { retryUnlessUnsupported } from "@/features/sample-data/utils/unsupported";
import { transactionListQuerySchema } from "./schemas/transaction.schema";
import type { TransactionListFilter, TransactionListResult } from "./types";

type RawSearchParams = Record<string, string | string[] | undefined>;

const LIST_PATH = "/v1/admin/merchants/transaction";
const DEFAULT_FILTER: TransactionListFilter = { page: 1, pageSize: 10 };

function onlyStrings(raw: RawSearchParams): Record<string, string> {
  const entries = Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "");
  return Object.fromEntries(entries);
}

/** Invalid input never breaks the page: it falls back to the default first page. */
export function parseTransactionSearchParams(raw: RawSearchParams): TransactionListFilter {
  const parsed = transactionListQuerySchema.safeParse(onlyStrings(raw));
  return parsed.success ? parsed.data : DEFAULT_FILTER;
}

export function toTransactionSearchParams(filter: TransactionListFilter): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params;
}

export const transactionQueries = {
  list: (filter: TransactionListFilter) =>
    queryOptions({
      queryKey: ["transactions", "list", filter] as const,
      queryFn: () =>
        apiClient.get<TransactionListResult>(LIST_PATH, { query: Object.fromEntries(toTransactionSearchParams(filter)) }),
      retry: retryUnlessUnsupported,
    }),
};
