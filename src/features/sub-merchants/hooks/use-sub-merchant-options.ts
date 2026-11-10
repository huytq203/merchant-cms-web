import { queryOptions, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/http/api-client';
import type { SubMerchantStatus } from '../types';

export type SubMerchantOption = { id: string; name: string; code: string; isDefault: boolean };

/** A row of the light Sub list (`GET /api/v1/admin/sub-merchants/choices`). */
export type SubMerchantChoiceRow = {
  id: string;
  code: string;
  name: string;
  status: SubMerchantStatus;
  merchantId?: string | null;
  isDefault?: boolean;
};

/** One shared query for every Sub picker on the page: the list is small (cap 500) and the same for all of them. */
export const subMerchantChoicesQuery = () => queryOptions({
  queryKey: ['sub-merchants', 'choices'] as const,
  queryFn: () => apiClient.get<SubMerchantChoiceRow[]>('/v1/admin/sub-merchants/choices'),
  staleTime: 60_000,
});

/**
 * The Subs a picker may offer, from the light choices route. Before 11/11 the pickers read the management list,
 * which needs MANAGE_SUB_MERCHANT and a Master id, so a viewer or a Sub-only user got a 403 and an empty dropdown.
 * Pass a merchant id to keep only that Master's outlets (rows without a Master id are kept, for older BEs).
 */
export function useSubMerchantOptions(merchantId?: string): UseQueryResult<SubMerchantOption[]> {
  return useQuery({
    ...subMerchantChoicesQuery(),
    select: (rows): SubMerchantOption[] =>
      rows
        .filter((row) => !merchantId || !row.merchantId || row.merchantId === merchantId)
        .map(({ id, name, code, isDefault }) => ({ id, name, code, isDefault: isDefault ?? false })),
  });
}
