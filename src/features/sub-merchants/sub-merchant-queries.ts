import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/http/api-client';
import type { SubMerchantDetail, SubMerchantListFilter, SubMerchantListResult } from './types';

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseSubMerchantSearchParams(raw: RawSearchParams): SubMerchantListFilter {
  const numeric = (value: string | string[] | undefined, fallback: number, max = Infinity) => {
    const parsed = typeof value === 'string' ? Number(value) : NaN;
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
  };
  const page = numeric(raw.page, 1);
  const pageSize = numeric(raw.pageSize, 10, 100);
  // The merchant endpoint only paginates, so keyword/status in the URL are intentionally ignored.
  return { page, pageSize };
}

export const subMerchantQueries = {
  list: (filter: SubMerchantListFilter) => {
    const pagination = { page: filter.page, pageSize: filter.pageSize };
    return queryOptions({
      queryKey: ['sub-merchants', 'list', pagination] as const,
      queryFn: () => apiClient.get<SubMerchantListResult>('/v1/admin/sub-merchants', { query: pagination }),
    });
  },
  detail: (id: string) => queryOptions({
    queryKey: ['sub-merchants', 'detail', id] as const,
    queryFn: () => apiClient.get<SubMerchantDetail>(`/v1/admin/sub-merchants/${id}`),
  }),
};
