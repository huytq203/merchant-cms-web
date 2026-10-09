// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { apiClient } from '@/lib/http/api-client';
import { subMerchantQueries } from '../../sub-merchant-queries';
import { useSubMerchantOptions } from '../use-sub-merchant-options';

const row = {
  id: 'd4c3b2a1-0000-4000-8000-000000000001', code: 'SM001', name: 'Chi nhánh Một',
  status: 'ACTIVE' as const, isDefault: false, lockSource: null, merchantId: null,
  merchantCode: null, merchantName: null, phone: null, createdAt: null,
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

afterEach(() => vi.restoreAllMocks());

describe('useSubMerchantOptions', () => {
  it('maps list rows and shares the list query cache', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ rows: [row], total: 1 });
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useSubMerchantOptions(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: row.id, name: row.name, code: row.code, isDefault: false }]);
    expect(client.getQueryData(subMerchantQueries.list({ page: 1, pageSize: 100 }).queryKey))
      .toEqual({ rows: [row], total: 1 });
  });

  it('exposes loading until the list resolves', async () => {
    let resolveRequest: (value: { rows: typeof row[]; total: number }) => void = () => {};
    vi.spyOn(apiClient, 'get').mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    const { wrapper } = setup();
    const { result } = renderHook(() => useSubMerchantOptions(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    await act(async () => resolveRequest({ rows: [], total: 0 }));
    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it('reports request failure and recovers after refetch', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Unavailable'))
      .mockResolvedValueOnce({ rows: [row], total: 1 });
    const { wrapper } = setup();
    const { result } = renderHook(() => useSubMerchantOptions(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.data).toEqual([{ id: row.id, name: row.name, code: row.code, isDefault: false }]));
  });
});
