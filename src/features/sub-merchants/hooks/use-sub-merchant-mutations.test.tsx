// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { apiClient } from '@/lib/http/api-client';
import { useLockSubMerchant } from './use-sub-merchant-mutations';

const detail = { id: 'one', name: 'Shop', status: 'ACTIVE' };
const detailKey = ['sub-merchants', 'detail', 'one'];

afterEach(() => vi.restoreAllMocks());

describe('lock mutation', () => {
  it('updates detail and invalidates sub merchant queries after success', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ ...detail, status: 'INACTIVE' });
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
    client.setQueryData(detailKey, detail);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useLockSubMerchant(), { wrapper });
    await act(async () => { await result.current.mutateAsync({ id: 'one', reason: 'Valid reason' }); });
    expect(client.getQueryData(detailKey)).toMatchObject({ status: 'INACTIVE' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['sub-merchants'] });
  });

  it('keeps cached detail after a failed request', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Request failed'));
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    client.setQueryData(detailKey, detail);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useLockSubMerchant(), { wrapper });
    await act(async () => { await expect(result.current.mutateAsync({ id: 'one', reason: 'Valid reason' })).rejects.toThrow('Request failed'); });
    await waitFor(() => expect(client.getQueryData(detailKey)).toEqual(detail));
  });
});
