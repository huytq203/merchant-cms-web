"use client";

import { useQuery } from "@tanstack/react-query";
import { usePreservedValue } from "@/lib/hooks/use-preserved-value";
import { ApiError } from "@/lib/http/api-client";
import type { useUserActions } from "../hooks/use-user-actions";
import type { UserDialogsState } from "../hooks/use-user-dialogs";
import { UserDetailModal } from "./UserDetailModal";
import { UserLockDialog } from "./UserLockDialog";
import { UserModal } from "./UserModal";
import { UserResetPasswordDialog } from "./UserResetPasswordDialog";
import { UserUnlockDialog } from "./UserUnlockDialog";

type Actions = ReturnType<typeof useUserActions>;

interface Props {
  dialogs: UserDialogsState;
  openFor: UserDialogsState["openFor"];
  actions: Actions;
  merchantId: string;
  merchantIds: string[];
  actorId: string;
}

interface SectionProps extends Pick<Props, "dialogs" | "actions" | "openFor" | "actorId"> {
  onOpenChange: (open: boolean) => void;
}

function UserFormDialog({ dialogs, actions, onOpenChange, merchantId, merchantIds, actorId }: SectionProps & Pick<Props, "merchantId" | "merchantIds">) {
  const { activeDialog, target } = dialogs;
  const { saveAction } = actions;

  return (
    <UserModal
      open={activeDialog === "create" || activeDialog === "edit"}
      onOpenChange={onOpenChange}
      merchantId={merchantId}
      merchantIds={merchantIds}
      actorId={actorId}
      user={activeDialog === "edit" ? target : null}
      isSubmitting={saveAction.isSaving}
      emailError={saveAction.emailError}
      error={saveAction.error}
      onSubmit={(values) => void saveAction.save(target, values)}
    />
  );
}

function UserDetailDialog({ dialogs, actions, openFor, actorId, onOpenChange, merchantIds }: SectionProps & Pick<Props, "merchantIds">) {
  const { target } = dialogs;
  const { commandAction } = actions;
  const shown = usePreservedValue(target);
  const proposal = useQuery({
    queryKey: ["users", "scope-proposal", shown?.id],
    queryFn: () => commandAction.getScopeProposal(shown?.id ?? ""),
    enabled: dialogs.activeDialog === "detail" && shown !== null,
    retry: false,
  });
  const hasNoProposal = proposal.error instanceof ApiError && proposal.error.status === 404;
  const loadError = proposal.error && !hasNoProposal ? proposal.error.message : undefined;
  const reviewId = shown?.id;

  return (
    <UserDetailModal
      open={dialogs.activeDialog === "detail"}
      onOpenChange={onOpenChange}
      user={target}
      actorId={actorId}
      merchantIds={merchantIds}
      proposal={proposal.data ?? null}
      proposalError={loadError ?? commandAction.error}
      isPending={commandAction.isScopePending}
      onApprove={() => {
        if (reviewId) void commandAction.approveScopeProposal(reviewId);
      }}
      onReject={(reason) => {
        if (reviewId) void commandAction.rejectScopeProposal(reviewId, reason);
      }}
      onReset={() => {
        if (target) openFor("reset", target);
      }}
      onToggleLock={() => {
        if (target) openFor(target.status === "LOCKED" ? "unlock" : "lock", target);
      }}
      onEdit={() => {
        if (target) openFor("edit", target);
      }}
    />
  );
}

function UserCommandDialogs({ dialogs, actions, actorId, onOpenChange }: SectionProps) {
  const { activeDialog, target } = dialogs;
  const { commandAction } = actions;

  return (
    <>
      <UserLockDialog
        open={activeDialog === "lock"}
        onOpenChange={onOpenChange}
        user={target}
        isPending={commandAction.pending.lock}
        error={commandAction.error}
        onConfirm={(reason) => {
          if (target) void commandAction.confirm("lock", target.id, { command: "lock", reason });
        }}
      />
      <UserUnlockDialog
        open={activeDialog === "unlock"}
        onOpenChange={onOpenChange}
        user={target}
        isPending={commandAction.pending.unlock}
        error={commandAction.error}
        onConfirm={() => {
          if (target) void commandAction.confirm("unlock", target.id);
        }}
      />
      <UserResetPasswordDialog
        open={activeDialog === "reset"}
        onOpenChange={onOpenChange}
        user={target}
        actorId={actorId}
        isPending={commandAction.pending.resetPassword}
        isSuccess={commandAction.isPasswordResetDone}
        error={commandAction.error}
        onConfirm={() => {
          if (target) void commandAction.requestPasswordReset(target.id);
        }}
      />
    </>
  );
}

export function UserDialogs({ dialogs, openFor, actions, merchantId, merchantIds, actorId }: Props) {
  const onOpenChange = (open: boolean) => {
    if (!open) actions.closeDialogs();
  };
  const section = { dialogs, actions, openFor, actorId, onOpenChange };

  return (
    <>
      <UserFormDialog {...section} merchantId={merchantId} merchantIds={merchantIds} />
      <UserDetailDialog {...section} merchantIds={merchantIds} />
      <UserCommandDialogs {...section} />
    </>
  );
}
