import { queryOptions, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/http/api-client';
import type { PermissionCatalogItem, PermissionGroup, PermissionGroupUser } from './schemas/permission-group.schema';

type RawSearchParams = Record<string, string | string[] | undefined>;

export interface PermissionGroupFilter {
  page: number;
  pageSize: number;
  query?: string;
  systemOnly?: boolean;
}

export interface PermissionGroupPage<T> {
  rows: T[];
  total: number;
}

export function parsePermissionGroupSearchParams(raw: RawSearchParams): PermissionGroupFilter {
  const numeric = (value: string | string[] | undefined, fallback: number, max = Infinity) => {
    const parsed = typeof value === 'string' ? Number(value) : NaN;
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
  };
  const page = numeric(raw.page, 1);
  const pageSize = numeric(raw.pageSize, 10, 100);
  const keyword = typeof raw.keyword === 'string' && raw.keyword.length <= 100 ? raw.keyword.trim() : '';
  const systemOnly = raw.systemOnly === 'true' ? true : raw.systemOnly === 'false' ? false : undefined;
  return {
    page,
    pageSize,
    ...(keyword ? { query: keyword } : {}),
    ...(systemOnly === undefined ? {} : { systemOnly }),
  };
}

export const permissionGroupQueries = {
  list: (filter: PermissionGroupFilter) => queryOptions({
    queryKey: ['permission-groups', 'list', filter] as const,
    queryFn: () => apiClient.get<PermissionGroupPage<PermissionGroup>>('/v1/merchant/permission-groups', { query: { ...filter } }),
    staleTime: 300_000,
  }),
  catalog: () => queryOptions({
    queryKey: ['permission-groups', 'catalog'] as const,
    queryFn: () => apiClient.get<PermissionCatalogItem[]>('/v1/merchant/merchant-permissions'),
    staleTime: 3_600_000,
  }),
  detail: (id: string) => queryOptions({
    queryKey: ['permission-groups', 'detail', id] as const,
    queryFn: () => apiClient.get<PermissionGroup>(`/v1/merchant/permission-groups/${id}`),
  }),
  users: (id: string, page: number) => queryOptions({
    queryKey: ['permission-groups', 'users', id, page] as const,
    queryFn: () => apiClient.get<PermissionGroupPage<PermissionGroupUser>>(`/v1/merchant/permission-groups/${id}/users`, { query: { page } }),
  }),
};

export function usePermissionGroups(filter: PermissionGroupFilter) {
  return useQuery(permissionGroupQueries.list(filter));
}

export function usePermissionCatalog() {
  return useQuery(permissionGroupQueries.catalog());
}

export function usePermissionGroup(id: string) {
  return useQuery({ ...permissionGroupQueries.detail(id), enabled: Boolean(id) });
}

export function useListGroupUsers(groupId: string, page: number) {
  return useQuery({ ...permissionGroupQueries.users(groupId, page), enabled: Boolean(groupId) });
}
