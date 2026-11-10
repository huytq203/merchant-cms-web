import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/http/api-client';
import { parseSubMerchantSearchParams, subMerchantQueries } from '../sub-merchant-queries';

describe('sub merchant query contract', () => {
  it('keys and requests the list with the BE filters, leaving out empty ones', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ rows: [], total: 0 });
    const filter = { page: 2, pageSize: 20, code: 'S001', status: 'ACTIVE' as const };
    const query = subMerchantQueries.list(filter);
    const params = { page: 2, pageSize: 20, code: 'S001', status: 'ACTIVE' };
    expect(query.queryKey).toEqual(['sub-merchants', 'list', params]);
    await query.queryFn!({} as never);
    expect(get).toHaveBeenCalledWith('/v1/admin/sub-merchants', { query: params });
    get.mockRestore();
  });

  it('sends the merchant when one is chosen and keys the cache by it', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ rows: [], total: 0 });
    const filter = { page: 1, pageSize: 100, merchantId: 'm-1' };
    const query = subMerchantQueries.list(filter);
    expect(query.queryKey).toEqual(['sub-merchants', 'list', { page: 1, pageSize: 100, merchantId: 'm-1' }]);
    expect(query.queryKey).not.toEqual(subMerchantQueries.list({ page: 1, pageSize: 100 }).queryKey);
    await query.queryFn!({} as never);
    expect(get).toHaveBeenCalledWith('/v1/admin/sub-merchants', { query: { page: 1, pageSize: 100, merchantId: 'm-1' } });
    get.mockRestore();
  });

  it('gives each filter its own cache entry', () => {
    const base = { page: 1, pageSize: 10 };
    expect(subMerchantQueries.list({ ...base, name: 'A' }).queryKey).not.toEqual(subMerchantQueries.list(base).queryKey);
  });

  it('uses a detail key for one sub merchant', () => {
    expect(subMerchantQueries.detail('abc').queryKey).toEqual(['sub-merchants', 'detail', 'abc']);
  });

  it('defaults missing and invalid pagination and drops an unknown status', () => {
    expect(parseSubMerchantSearchParams({})).toEqual({ page: 1, pageSize: 10 });
    expect(parseSubMerchantSearchParams({ page: '-1', pageSize: 'x', status: 'OTHER' })).toEqual({ page: 1, pageSize: 10 });
  });

  it('reads code, name and a valid status from the URL', () => {
    expect(parseSubMerchantSearchParams({ page: '3', pageSize: '20', code: ' S001 ', name: 'Shop', status: 'INACTIVE' }))
      .toEqual({ page: 3, pageSize: 20, code: 'S001', name: 'Shop', status: 'INACTIVE' });
  });

  it('ignores blank or oversized text filters', () => {
    expect(parseSubMerchantSearchParams({ code: '   ', name: 'x'.repeat(101) })).toEqual({ page: 1, pageSize: 10 });
  });

  it('keeps the receiving-account and created-date filters from the URL and sends them to the API', async () => {
    const filter = parseSubMerchantSearchParams({ hasBankAccount: 'false', createdFrom: '2026-09-01', createdTo: '2026-09-30' });
    expect(filter).toEqual({ page: 1, pageSize: 10, hasBankAccount: false, createdFrom: '2026-09-01', createdTo: '2026-09-30' });
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ rows: [], total: 0 });
    await subMerchantQueries.list(filter).queryFn!({} as never);
    expect(get).toHaveBeenCalledWith('/v1/admin/sub-merchants', {
      query: { page: 1, pageSize: 10, hasBankAccount: false, createdFrom: '2026-09-01', createdTo: '2026-09-30' },
    });
    get.mockRestore();
  });

  it('drops a malformed date and an unknown account choice', () => {
    expect(parseSubMerchantSearchParams({ hasBankAccount: 'maybe', createdFrom: '01/09/2026', createdTo: 'x' })).toEqual({ page: 1, pageSize: 10 });
  });
});
