"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/http/api-client";
import type { MerchantUser, UserFormValues } from "../schemas/user.schema";
import { notifyPasswordReset } from "../utils/password-reset-feedback";
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
    if (!hasSameIds(values.groupIds, target.groups)) {
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
  /**
   * Success closes the dialog and reports through a toast (green, or yellow when the mail failed).
   * A failure keeps the dialog open for a retry and adds a red toast with the BE message.
   */
  const requestPasswordReset = async (user: Pick<MerchantUser, "id" | "email">) => {
    setError(undefined);
    try {
      const result = await resetPassword.mutateAsync({ id: user.id });
      notifyPasswordReset(result, user.email);
      onDone();
    } catch (failure) {
      const message = messageOf(failure, "Không gửi được yêu cầu đặt lại mật khẩu");
      setError(message);
      toast.error(message);
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
