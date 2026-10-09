import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { subMerchantQueries } from '../sub-merchant-queries';

export type SubMerchantOption = { id: string; name: string; code: string; isDefault: boolean };

export function useSubMerchantOptions(): UseQueryResult<SubMerchantOption[]> {
  return useQuery({
    ...subMerchantQueries.list({ page: 1, pageSize: 100 }),
    select: (data): SubMerchantOption[] =>
      data.rows.map(({ id, name, code, isDefault }) => ({ id, name, code, isDefault })),
  });
}
