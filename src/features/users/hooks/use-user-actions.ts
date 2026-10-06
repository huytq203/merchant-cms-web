"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/lib/http/api-client";
import { apiClient } from "@/lib/http/api-client";
import type { MerchantUser, ScopeProposal, UserFormValues } from "../schemas/user.schema";
import { hasSameIds } from "../utils/user-mapper";
import {
  useAssignUserGroups,
  useCreateUser,
  useLockUser,
  useResetUserPassword,
  useUnlockUser,
  useUpdateUser,
} from "./use-user-mutations";

export type UserCommand = "lock" | "unlock" | "reset-password" | "assign-groups";

export type ResetPasswordOtp = {
  otpSessionId: string;
  otp: string;
};

type UserCommandInput =
  | { command: "lock"; reason: string }
  | { command: "reset-password"; otp: ResetPasswordOtp }
  | { command: "assign-groups"; groupIds: string[] };

const userRoot = "/v1/merchant/merchant-users";

function userPath(id: string, action: string): string {
  return `${userRoot}/${encodeURIComponent(id)}${action}`;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function partialFailureMessage(completed: string[], error: unknown): string {
  const reason = messageOf(error, "Không lưu được người dùng");
  if (completed.length === 0) return reason;
  return `Đã cập nhật ${completed.join(", ")} nhưng chưa hoàn tất các bước còn lại: ${reason}`;
}

type EditMutations = {
  update: ReturnType<typeof useUpdateUser>;
  assign: ReturnType<typeof useAssignUserGroups>;
};

async function runEditSteps(
  mutations: EditMutations,
  target: MerchantUser,
  values: UserFormValues,
): Promise<void> {
  const completed: string[] = [];
  try {
    await mutations.update.mutateAsync({ id: target.id, values: { fullName: values.fullName, phone: values.phone } });
    completed.push("thông tin");
    if (!hasSameIds(values.groupIds, target.groupIds)) {
      await mutations.assign.mutateAsync({ id: target.id, groupIds: values.groupIds });
      completed.push("nhóm quyền");
    }
  } catch (error) {
    throw new Error(partialFailureMessage(completed, error));
  }
}

export function useUserSaveAction(onDone: () => void, assign: ReturnType<typeof useAssignUserGroups>) {
  const create = useCreateUser();
  const update = useUpdateUser();
  const [emailError, setEmailError] = useState<string>();
  const [error, setError] = useState<string>();
  const clearErrors = () => {
    setEmailError(undefined);
    setError(undefined);
  };
  const save = async (target: MerchantUser | null, values: UserFormValues) => {
    clearErrors();
    try {
      if (target) {
        await runEditSteps({ update, assign }, target, values);
      } else {
        await create.mutateAsync(values);
      }
      onDone();
    } catch (failure) {
      if (!target && failure instanceof ApiError && failure.status === 409) setEmailError(failure.message);
      else setError(messageOf(failure, "Không lưu được người dùng"));
    }
  };
  const isSaving = create.isPending || update.isPending || assign.isPending;
  return { save, isSaving, emailError, error, clearErrors };
}

export function useUserCommandActions(onDone: () => void) {
  const lock = useLockUser();
  const unlock = useUnlockUser();
  const resetPassword = useResetUserPassword();
  const assignGroups = useAssignUserGroups();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const approveScope = useMutation({
    mutationFn: (id: string) => apiClient.post<ScopeProposal>(userPath(id, "/scope-proposal/approve")),
    onSuccess: (_proposal, id) => queryClient.invalidateQueries({ queryKey: ["users", "scope-proposal", id] }),
  });
  const rejectScope = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post<ScopeProposal>(userPath(id, "/scope-proposal/reject"), { reason }),
    onSuccess: (_proposal, { id }) => queryClient.invalidateQueries({ queryKey: ["users", "scope-proposal", id] }),
  });
  const confirm = async (command: UserCommand, id: string, input?: UserCommandInput) => {
    setError(undefined);
    try {
      if (command === "lock" && input?.command === "lock") await lock.mutateAsync({ id, reason: input.reason });
      if (command === "unlock") await unlock.mutateAsync({ id });
      if (command === "reset-password" && input?.command === "reset-password") {
        await resetPassword.mutateAsync({ id, otp: input.otp });
      }
      if (command === "assign-groups" && input?.command === "assign-groups") {
        await assignGroups.mutateAsync({ id, groupIds: input.groupIds });
      }
      onDone();
    } catch (failure) {
      setError(messageOf(failure, "Thao tác thất bại"));
    }
  };
  const getScopeProposal = (id: string) => apiClient.get<ScopeProposal>(userPath(id, "/scope-proposal"));
  const approveScopeProposal = async (id: string) => {
    setError(undefined);
    try {
      await approveScope.mutateAsync(id);
    } catch (failure) {
      setError(messageOf(failure, "Không duyệt được đề xuất phạm vi"));
    }
  };
  const rejectScopeProposal = async (id: string, reason: string) => {
    setError(undefined);
    try {
      await rejectScope.mutateAsync({ id, reason });
    } catch (failure) {
      setError(messageOf(failure, "Không từ chối được đề xuất phạm vi"));
    }
  };
  const pending = {
    lock: lock.isPending,
    unlock: unlock.isPending,
    resetPassword: resetPassword.isPending,
    assignGroups: assignGroups.isPending,
  };
  return {
    confirm,
    error,
    clearError: () => setError(undefined),
    pending,
    getScopeProposal,
    approveScopeProposal,
    rejectScopeProposal,
    isScopePending: approveScope.isPending || rejectScope.isPending,
    assignGroups,
  };
}

export function useUserActions(closeDialogs: () => void) {
  const commandAction = useUserCommandActions(closeDialogs);
  const saveAction = useUserSaveAction(closeDialogs, commandAction.assignGroups);
  const closeAndClear = () => {
    saveAction.clearErrors();
    commandAction.clearError();
    closeDialogs();
  };
  return { saveAction, commandAction, closeAndClear };
}
