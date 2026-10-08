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

/** Shown only when the BE sends no message of its own. */
const toastOf = (fallback: string) => ({ toast: { fallback } });

export function useCreateUser() {
  return useUserMutation((values: UserFormValues) =>
    apiClient.post<MerchantUser>(root, values, toastOf("Thêm người dùng thành công")),
  );
}

export function useUpdateUser() {
  return useUserMutation(
    ({ id, values }: { id: string; values: { fullName: string; phone?: string } }) =>
      apiClient.put<MerchantUser>(itemPath(id), values, toastOf("Cập nhật người dùng thành công")),
  );
}

export function useLockUser() {
  return useUserMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post<MerchantUser>(itemPath(id, "/lock"), { reason }, toastOf("Khóa người dùng thành công")),
  );
}

export function useUnlockUser() {
  return useUserMutation(
    ({ id }: { id: string }) => apiClient.post<MerchantUser>(itemPath(id, "/unlock"), undefined, toastOf("Mở khóa người dùng thành công")),
  );
}

export function useResetUserPassword() {
  return useUserMutation(async ({ id }: { id: string }) => {
    await apiClient.post<unknown>(itemPath(id, "/reset-password"));
    return { success: true as const };
  });
}

export function useResendUserActivation() {
  return useUserMutation(({ id }: { id: string }) =>
    apiClient.post<{ id: string }>(itemPath(id, "/resend-activation"), undefined, toastOf("Đã gửi lại email kích hoạt")),
  );
}

export function useAssignUserGroups() {
  return useUserMutation(
    ({ id, groupIds }: { id: string; groupIds: string[] }) =>
      apiClient.post<MerchantUser>(itemPath(id, "/assign-groups"), { ids: groupIds }, toastOf("Cập nhật nhóm quyền thành công")),
  );
}
