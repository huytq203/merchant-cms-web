// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { apiClient } from '@/lib/http/api-client';
import { useSubMerchantOptions, type SubMerchantChoiceRow } from '../use-sub-merchant-options';

const masterA = 'aaaaaaaa-0000-4000-8000-000000000001';
const masterB = 'bbbbbbbb-0000-4000-8000-000000000002';
const row: SubMerchantChoiceRow = {
  id: 'd4c3b2a1-0000-4000-8000-000000000001', code: 'SM001', name: 'Chi nhánh Một', status: 'ACTIVE', merchantId: masterA, isDefault: true,
};
const other: SubMerchantChoiceRow = {
  id: 'd4c3b2a1-0000-4000-8000-000000000002', code: 'SM002', name: 'Chi nhánh Hai', status: 'ACTIVE', merchantId: masterB, isDefault: false,
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

afterEach(() => vi.restoreAllMocks());

describe('useSubMerchantOptions', () => {
  it('reads the light choices route, not the management list that needs MANAGE_SUB_MERCHANT', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue([row]);
    const { wrapper } = setup();
    const { result } = renderHook(() => useSubMerchantOptions(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/v1/admin/sub-merchants/choices');
    expect(result.current.data).toEqual([{ id: row.id, name: row.name, code: row.code, isDefault: true }]);
  });

  it('keeps only the chosen Master outlets when a merchant id is given', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue([row, other]);
    const { wrapper } = setup();
    const { result } = renderHook(() => useSubMerchantOptions(masterB), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((option) => option.id)).toEqual([other.id]);
  });

  it('keeps rows without a Master id and defaults the flag when an older BE omits them', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue([{ id: row.id, code: row.code, name: row.name, status: 'ACTIVE' }]);
    const { wrapper } = setup();
    const { result } = renderHook(() => useSubMerchantOptions(masterB), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: row.id, name: row.name, code: row.code, isDefault: false }]);
  });

  it('shares one request between several pickers', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue([row]);
    const { wrapper } = setup();
    const first = renderHook(() => useSubMerchantOptions(), { wrapper });
    const second = renderHook(() => useSubMerchantOptions(masterA), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess && second.result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('reports request failure and recovers after refetch', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce([row]);
    const { wrapper } = setup();
    const { result } = renderHook(() => useSubMerchantOptions(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(result.current.data).toEqual([{ id: row.id, name: row.name, code: row.code, isDefault: true }]));
  });
});
