import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import type { AssignableGroup, MerchantUser, MerchantUserStatus } from "./schemas/user.schema";

export interface UserFilter {
  page: number;
  pageSize: number;
  query?: string;
  status?: MerchantUserStatus;
  merchantId?: string;
  /** Only users holding this permission group. */
  permissionGroupId?: string;
  /** Scope filter: `MASTER` = users with Master-wide access, otherwise the id of one Sub-merchant. */
  scope?: string;
}

/** The value of the scope filter that stands for "Master-wide users"; any other value is a Sub-merchant id. */
export const MASTER_SCOPE = "MASTER";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const permissionGroupId = typeof raw.permissionGroupId === "string" && UUID_PATTERN.test(raw.permissionGroupId)
    ? raw.permissionGroupId
    : undefined;
  const scope = typeof raw.scope === "string" && (raw.scope === MASTER_SCOPE || UUID_PATTERN.test(raw.scope))
    ? raw.scope
    : undefined;
  return {
    page,
    pageSize,
    ...(query ? { query } : {}),
    ...(status ? { status } : {}),
    ...(merchantId ? { merchantId } : {}),
    ...(permissionGroupId ? { permissionGroupId } : {}),
    ...(scope ? { scope } : {}),
  };
}

export const userQueries = {
  /** Một người dùng theo id, cho liên kết `?detail=`. */
  detail: (id: string) => queryOptions({
    queryKey: ["users", "detail", id] as const,
    queryFn: () => apiClient.get<MerchantUser>(`/v1/merchant/merchant-users/${encodeURIComponent(id)}`),
  }),
  list: (filter: UserFilter) => queryOptions({
    queryKey: ["users", "list", filter] as const,
    queryFn: () => apiClient.get<UserPage>("/v1/merchant/merchant-users", { query: { ...filter } }),
    staleTime: 30_000,
  }),
};

/** Groups the actor may give to another user; unlike the permission-group list it needs only MANAGE_USER. */
export const assignableGroupQueries = {
  list: () => queryOptions({
    queryKey: ["users", "assignable-groups"] as const,
    queryFn: () => apiClient.get<AssignableGroup[]>("/v1/merchant/merchant-users/assignable-groups"),
    staleTime: 60_000,
  }),
};

export function useAssignableGroups() {
  return useQuery(assignableGroupQueries.list());
}

export function useUsers(filter: UserFilter) {
  return useQuery(userQueries.list(filter));
}
