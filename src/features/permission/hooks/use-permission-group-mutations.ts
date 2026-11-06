import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/http/api-client';
import type { PermissionGroup, PermissionGroupFormValues } from '../schemas/permission-group.schema';
import { assignableGroupQueries } from '@/features/users/user-queries';
import { permissionGroupQueries } from '../permission-group-queries';

const base = '/v1/merchant/permission-groups';
const listKey = ['permission-groups', 'list'] as const;

/** The user forms pick from the assignable list, which follows group changes. */
function invalidateGroupLists(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: listKey });
  void client.invalidateQueries({ queryKey: assignableGroupQueries.list().queryKey });
}

export function useCreatePermissionGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values: PermissionGroupFormValues) => apiClient.post<PermissionGroup>(base, values),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: permissionGroupQueries.catalog().queryKey });
      invalidateGroupLists(client);
    },
  });
}

export function useUpdatePermissionGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PermissionGroupFormValues }) =>
      apiClient.put<PermissionGroup>(`${base}/${id}`, values),
    onSuccess: (group, variables) => {
      client.setQueryData(permissionGroupQueries.detail(variables.id).queryKey, group);
      void client.invalidateQueries({ queryKey: permissionGroupQueries.detail(variables.id).queryKey });
      invalidateGroupLists(client);
    },
  });
}

export function useDeletePermissionGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`${base}/${id}`),
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: permissionGroupQueries.detail(id).queryKey });
      invalidateGroupLists(client);
    },
  });
}
