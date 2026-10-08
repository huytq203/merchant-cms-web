"use client";

import { useState } from "react";
import { ApiError } from "@/lib/http/api-client";
import type { MerchantUser, UserFormValues } from "../schemas/user.schema";
import { hasSameIds } from "../utils/user-mapper";
import {
  useAssignUserGroups,
  useCreateUser,
  useLockUser,
  useResetUserPassword,
  useUnlockUser,
  useUpdateUser,
} from "./use-user-mutations";
import { useScopeProposalActions } from "./use-scope-proposal-actions";

export type UserCommand = "lock" | "unlock" | "assign-groups";

type UserCommandInput =
  | { command: "lock"; reason: string }
  | { command: "assign-groups"; groupIds: string[] };

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
  const [error, setError] = useState<string>();
  const proposal = useScopeProposalActions(setError);
  const confirm = async (command: UserCommand, id: string, input?: UserCommandInput) => {
    setError(undefined);
    try {
      if (command === "lock" && input?.command === "lock") await lock.mutateAsync({ id, reason: input.reason });
      if (command === "unlock") await unlock.mutateAsync({ id });
      if (command === "assign-groups" && input?.command === "assign-groups") {
        await assignGroups.mutateAsync({ id, groupIds: input.groupIds });
      }
      onDone();
    } catch (failure) {
      setError(messageOf(failure, "Thao tác thất bại"));
    }
  };
  /** Stays open on success so the dialog can show the result; the caller closes it with "Xong". */
  const requestPasswordReset = async (id: string) => {
    setError(undefined);
    try {
      await resetPassword.mutateAsync({ id });
    } catch (failure) {
      setError(messageOf(failure, "Không gửi được yêu cầu đặt lại mật khẩu"));
    }
  };

  return {
    confirm,
    requestPasswordReset,
    error,
    clearError: () => {
      setError(undefined);
      resetPassword.reset();
    },
    pending: {
      lock: lock.isPending,
      unlock: unlock.isPending,
      resetPassword: resetPassword.isPending,
      assignGroups: assignGroups.isPending,
    },
    isPasswordResetDone: resetPassword.isSuccess,
    ...proposal,
    assignGroups,
  };
}

export function useUserActions(closeDialogs: () => void) {
  const commandAction = useUserCommandActions(closeDialogs);
  const saveAction = useUserSaveAction(closeDialogs, commandAction.assignGroups);
  /** Feedback stays visible while a dialog fades out, so it is cleared when the next one opens. */
  const clearFeedback = () => {
    saveAction.clearErrors();
    commandAction.clearError();
  };
  return { saveAction, commandAction, clearFeedback, closeDialogs };
}
