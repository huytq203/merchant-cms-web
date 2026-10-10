import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/http/api-client';
import { subMerchantStatusSchema } from './schemas';
import type { SubMerchantDetail, SubMerchantListFilter, SubMerchantListResult } from './types';

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseSubMerchantSearchParams(raw: RawSearchParams): SubMerchantListFilter {
  const numeric = (value: string | string[] | undefined, fallback: number, max = Infinity) => {
    const parsed = typeof value === 'string' ? Number(value) : NaN;
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
  };
  const page = numeric(raw.page, 1);
  const pageSize = numeric(raw.pageSize, 10, 100);
  const text = (value: string | string[] | undefined) =>
    typeof value === 'string' && value.trim() && value.length <= 100 ? value.trim() : undefined;
  const code = text(raw.code);
  const name = text(raw.name);
  const status = subMerchantStatusSchema.safeParse(raw.status);
  return {
    page,
    pageSize,
    ...(code ? { code } : {}),
    ...(name ? { name } : {}),
    ...(status.success ? { status: status.data } : {}),
  };
}

export const subMerchantQueries = {
  list: (filter: SubMerchantListFilter) => {
    const params = {
      page: filter.page,
      pageSize: filter.pageSize,
      ...(filter.code ? { code: filter.code } : {}),
      ...(filter.name ? { name: filter.name } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.merchantId ? { merchantId: filter.merchantId } : {}),
    };
    return queryOptions({
      queryKey: ['sub-merchants', 'list', params] as const,
      queryFn: () => apiClient.get<SubMerchantListResult>('/v1/admin/sub-merchants', { query: params }),
    });
  },
  detail: (id: string) => queryOptions({
    queryKey: ['sub-merchants', 'detail', id] as const,
    queryFn: () => apiClient.get<SubMerchantDetail>(`/v1/admin/sub-merchants/${id}`),
  }),
};
