import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { retryUnlessUnsupported } from "@/features/sample-data/utils/unsupported";
import { complaintListQuerySchema } from "./schemas/complaint.schema";
import type { ComplaintListFilter, ComplaintListResult } from "./types/types";

type RawSearchParams = Record<string, string | string[] | undefined>;

const LIST_PATH = "/v1/admin/merchants/complaints";
const DEFAULT_FILTER: ComplaintListFilter = { page: 1, pageSize: 10 };

function onlyStrings(raw: RawSearchParams): Record<string, string> {
  const entries = Object.entries(raw).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "",
  );
  return Object.fromEntries(entries);
}

/** Invalid input never breaks the page: it falls back to the default first page. */
export function parseComplaintSearchParams(raw: RawSearchParams): ComplaintListFilter {
  const parsed = complaintListQuerySchema.safeParse(onlyStrings(raw));
  return parsed.success ? parsed.data : DEFAULT_FILTER;
}

export function toComplaintSearchParams(filter: ComplaintListFilter): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params;
}

export const complaintQueries = {
  list: (filter: ComplaintListFilter) =>
    queryOptions({
      queryKey: ["complaints", "list", filter] as const,
      queryFn: () =>
        apiClient.get<ComplaintListResult>(LIST_PATH, { query: Object.fromEntries(toComplaintSearchParams(filter)) }),
      retry: retryUnlessUnsupported,
    }),
};
