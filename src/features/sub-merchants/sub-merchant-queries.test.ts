import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/http/api-client';
import { parseSubMerchantSearchParams, subMerchantQueries } from './sub-merchant-queries';

describe('sub merchant query contract', () => {
  it('keys and requests the list by pagination only, because the endpoint cannot filter', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ rows: [], total: 0 });
    const filter = { page: 2, pageSize: 20, keyword: 'Shop', status: 'ACTIVE' as const };
    const query = subMerchantQueries.list(filter);
    expect(query.queryKey).toEqual(['sub-merchants', 'list', { page: 2, pageSize: 20 }]);
    await query.queryFn!({} as never);
    expect(get).toHaveBeenCalledWith('/v1/admin/sub-merchants', { query: { page: 2, pageSize: 20 } });
    get.mockRestore();
  });

  it('uses a detail key for one sub merchant', () => {
    expect(subMerchantQueries.detail('abc').queryKey).toEqual(['sub-merchants', 'detail', 'abc']);
  });

  it('defaults missing and invalid pagination and status', () => {
    expect(parseSubMerchantSearchParams({})).toEqual({ page: 1, pageSize: 10 });
    expect(parseSubMerchantSearchParams({ page: '-1', pageSize: 'x', status: 'OTHER' })).toEqual({ page: 1, pageSize: 10 });
  });

  it('keeps pagination from the URL and ignores unsupported filters', () => {
    expect(parseSubMerchantSearchParams({ page: '3', pageSize: '20', keyword: 'Shop', status: 'INACTIVE' })).toEqual({ page: 3, pageSize: 20 });
  });
});
