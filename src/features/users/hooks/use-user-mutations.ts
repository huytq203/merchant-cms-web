"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import type { MerchantUser, UserFormValues } from "../schemas/user.schema";

const root = "/v1/merchant/merchant-users";

function itemPath(id: string, action = ""): string {
  return `${root}/${encodeURIComponent(id)}${action}`;
}

function useUserMutation<TInput, TOutput>(request: (input: TInput) => Promise<TOutput>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () => client.invalidateQueries({ queryKey: ["users", "list"] }),
  });
}

export function useCreateUser() {
  return useUserMutation((values: UserFormValues) => apiClient.post<MerchantUser>(root, values));
}

export function useUpdateUser() {
  return useUserMutation(
    ({ id, values }: { id: string; values: { fullName: string; phone?: string } }) =>
      apiClient.put<MerchantUser>(itemPath(id), values),
  );
}

export function useLockUser() {
  return useUserMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post<MerchantUser>(itemPath(id, "/lock"), { reason }),
  );
}

export function useUnlockUser() {
  return useUserMutation(
    ({ id }: { id: string }) => apiClient.post<MerchantUser>(itemPath(id, "/unlock")),
  );
}

export function useResetUserPassword() {
  return useUserMutation(async ({ id }: { id: string }) => {
    await apiClient.post<unknown>(itemPath(id, "/reset-password"));
    return { success: true as const };
  });
}

export function useAssignUserGroups() {
  return useUserMutation(
    ({ id, groupIds }: { id: string; groupIds: string[] }) =>
      apiClient.post<MerchantUser>(itemPath(id, "/assign-groups"), { ids: groupIds }),
  );
}
