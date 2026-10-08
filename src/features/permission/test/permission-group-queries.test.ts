// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { mswServer } from '@/test/msw';
import { createElement, type ReactNode } from 'react';
import { parsePermissionGroupSearchParams, permissionGroupQueries } from '../permission-group-queries';
import { useCreatePermissionGroup, useUpdatePermissionGroup, useDeletePermissionGroup } from '../hooks/use-permission-group-mutations';

describe('permission group queries', () => {
  it('normalizes filters and keeps pagination in the list key', () => {
    const filter = parsePermissionGroupSearchParams({ page: '2', pageSize: '20', keyword: '  Kế toán  ', systemOnly: 'true' });
    expect(filter).toEqual({ page: 2, pageSize: 20, query: 'Kế toán', systemOnly: true });
    expect(permissionGroupQueries.list(filter).queryKey).toEqual(['permission-groups', 'list', filter]);
    expect(permissionGroupQueries.list(filter).staleTime).toBe(300_000);
  });

  it('falls back for invalid URL parameters and gives catalog a long stale time', () => {
    expect(parsePermissionGroupSearchParams({ page: '0', pageSize: '101', keyword: ' '.repeat(101) })).toEqual({ page: 1, pageSize: 10 });
    expect(permissionGroupQueries.catalog().queryKey).toEqual(['permission-groups', 'catalog']);
    expect(permissionGroupQueries.catalog().staleTime).toBeGreaterThan(300_000);
    expect(permissionGroupQueries.detail('group-1').queryKey).toEqual(['permission-groups', 'detail', 'group-1']);
  });
});

describe('permission group mutations', () => {
  it('invalidates the smallest affected keys after create, update and delete', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    const values = { code: 'ACCOUNTING', name: 'Kế toán', description: '', permissions: ['VIEW_ORDER'] };
    const group = { id: 'one', ...values, system: false };
    mswServer.use(http.post('/api/v1/merchant/permission-groups', () => HttpResponse.json(group)));
    mswServer.use(http.put('/api/v1/merchant/permission-groups/one', () => HttpResponse.json(group)));
    mswServer.use(http.delete('/api/v1/merchant/permission-groups/one', () => new HttpResponse(null, { status: 204 })));

    const create = renderHook(useCreatePermissionGroup, { wrapper });
    await create.result.current.mutateAsync(values);
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['permission-groups', 'catalog'] }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['permission-groups', 'list'] });

    const update = renderHook(useUpdatePermissionGroup, { wrapper });
    await update.result.current.mutateAsync({ id: 'one', values });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['permission-groups', 'detail', 'one'] });

    const remove = renderHook(useDeletePermissionGroup, { wrapper });
    await remove.result.current.mutateAsync('one');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['permission-groups', 'list'] });
  });
});
