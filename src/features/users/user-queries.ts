import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import type { MerchantUser, MerchantUserStatus } from "./schemas/user.schema";

export interface UserFilter {
  page: number;
  pageSize: number;
  query?: string;
  status?: MerchantUserStatus;
  merchantId?: string;
}

export interface UserPage {
  rows: MerchantUser[];
  total: number;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseUserSearchParams(raw: RawSearchParams, merchantIds: string[]): UserFilter {
  const numberInRange = (value: string | string[] | undefined, fallback: number, maximum: number) => {
    const parsed = typeof value === "string" ? Number(value) : NaN;
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : fallback;
  };
  const page = numberInRange(raw.page, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = numberInRange(raw.pageSize, 10, 100);
  const query = typeof raw.query === "string" && raw.query.length <= 100 ? raw.query.trim() : "";
  const status = raw.status === "PENDING" || raw.status === "ACTIVE" || raw.status === "LOCKED"
    ? raw.status
    : undefined;
  const merchantId = merchantIds.length > 1
    && typeof raw.merchantId === "string"
    && merchantIds.includes(raw.merchantId)
    ? raw.merchantId
    : undefined;
  return {
    page,
    pageSize,
    ...(query ? { query } : {}),
    ...(status ? { status } : {}),
    ...(merchantId ? { merchantId } : {}),
  };
}

export const userQueries = {
  list: (filter: UserFilter) => queryOptions({
    queryKey: ["users", "list", filter] as const,
    queryFn: () => apiClient.get<UserPage>("/v1/merchant/merchant-users", { query: { ...filter } }),
    staleTime: 30_000,
  }),
};

export function useUsers(filter: UserFilter) {
  return useQuery(userQueries.list(filter));
}
