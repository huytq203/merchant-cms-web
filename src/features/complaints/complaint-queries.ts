import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { complaintListQuerySchema } from "./schemas/complaint.schema";
import type { Complaint, ComplaintListFilter, ComplaintListResult } from "./types/types";

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Same-origin route handlers in front of `/api/v1/merchant/complaints`. */
export const COMPLAINTS_PATH = "/v1/admin/merchants/complaints";
export const complaintPath = (id: string, ...rest: string[]) =>
  [COMPLAINTS_PATH, encodeURIComponent(id), ...rest.map(encodeURIComponent)].join("/");

const DEFAULT_FILTER: ComplaintListFilter = { page: 1, pageSize: 10 };

function onlyStrings(raw: RawSearchParams): Record<string, string> {
  const entries = Object.entries(raw).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "",
  );
  return Object.fromEntries(entries);
}

/** Invalid input never breaks the page: it falls back to the default first page. */
export function parseComplaintSearchParams(raw: RawSearchParams): ComplaintListFilter {
  const strings = onlyStrings(raw);
  // URL đã lưu trước khi chuyển sang chọn nhiều Sub vẫn dùng `subMerchantId`.
  if (strings.subMerchantId && !strings.subMerchantIds) strings.subMerchantIds = strings.subMerchantId;
  const parsed = complaintListQuerySchema.safeParse(strings);
  return parsed.success ? parsed.data : DEFAULT_FILTER;
}

export function toComplaintSearchParams(filter: ComplaintListFilter): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params;
}

/** Every complaint query starts with this key, so a write can refresh list and detail at once. */
export const COMPLAINTS_KEY = ["complaints"] as const;

export const complaintQueries = {
  list: (filter: ComplaintListFilter) =>
    queryOptions({
      queryKey: [...COMPLAINTS_KEY, "list", filter] as const,
      queryFn: () =>
        apiClient.get<ComplaintListResult>(COMPLAINTS_PATH, { query: Object.fromEntries(toComplaintSearchParams(filter)) }),
      retry: 1,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...COMPLAINTS_KEY, "detail", id] as const,
      queryFn: () => apiClient.get<Complaint>(complaintPath(id)),
      retry: 1,
    }),
};
