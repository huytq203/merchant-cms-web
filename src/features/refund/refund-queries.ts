import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { retryUnlessUnsupported } from "@/features/sample-data/utils/unsupported";
import { refundListQuerySchema } from "./schemas/Refund.schema";
import type { RefundListFilter, RefundListResult } from "./types/type";

type RawSearchParams = Record<string, string | string[] | undefined>;

const LIST_PATH = "/v1/admin/merchants/refunds";
const DEFAULT_FILTER: RefundListFilter = { page: 1, pageSize: 10 };

function onlyStrings(raw: RawSearchParams): Record<string, string> {
  const entries = Object.entries(raw).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "",
  );
  return Object.fromEntries(entries);
}

/** Invalid input never breaks the page: it falls back to the default first page. */
export function parseRefundSearchParams(raw: RawSearchParams): RefundListFilter {
  const parsed = refundListQuerySchema.safeParse(onlyStrings(raw));
  return parsed.success ? parsed.data : DEFAULT_FILTER;
}

export function toRefundSearchParams(filter: RefundListFilter): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== "" && (!Array.isArray(value) || value.length)) {
      params.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
  }
  return params;
}

export const refundQueries = {
  list: (filter: RefundListFilter) =>
    queryOptions({
      queryKey: ["refunds", "list", filter] as const,
      queryFn: () =>
        apiClient.get<RefundListResult>(LIST_PATH, { query: Object.fromEntries(toRefundSearchParams(filter)) }),
      retry: retryUnlessUnsupported,
    }),
};
