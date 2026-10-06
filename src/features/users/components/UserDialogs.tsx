"use client";

import { useQuery } from "@tanstack/react-query";
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
  actions: Actions;
  merchantId: string;
  actorId: string;
}

interface SectionProps {
  dialogs: UserDialogsState;
  actions: Actions;
  onOpenChange: (open: boolean) => void;
}

function UserFormDialog({ dialogs, actions, onOpenChange, merchantId, actorId }: SectionProps & Pick<Props, "merchantId" | "actorId">) {
  const { activeDialog, target } = dialogs;
  const { saveAction } = actions;

  return (
    <UserModal
      key={`${activeDialog}:${target?.id ?? "new"}`}
      open={activeDialog === "create" || activeDialog === "edit"}
      onOpenChange={onOpenChange}
      merchantId={merchantId}
      actorId={actorId}
      user={activeDialog === "edit" ? target : null}
      isSubmitting={saveAction.isSaving}
      emailError={saveAction.emailError}
      error={saveAction.error}
      onSubmit={(values) => void saveAction.save(target, values)}
    />
  );
}

function UserDetailDialog({ dialogs, actions, onOpenChange }: SectionProps) {
  const { target } = dialogs;
  const { commandAction } = actions;
  const proposal = useQuery({
    queryKey: ["users", "scope-proposal", target?.id],
    queryFn: () => commandAction.getScopeProposal(target?.id ?? ""),
    enabled: dialogs.activeDialog === "detail" && target !== null,
    retry: false,
  });
  const hasNoProposal = proposal.error instanceof ApiError && proposal.error.status === 404;
  const proposalError = proposal.isError && !hasNoProposal ? proposal.error.message : undefined;

  return (
    <UserDetailModal
      key={target?.id ?? "none"}
      open={dialogs.activeDialog === "detail"}
      onOpenChange={onOpenChange}
      user={target}
      proposal={proposal.data ?? null}
      isProposalLoading={proposal.isPending}
      proposalError={proposalError ?? commandAction.error}
      isPending={commandAction.isScopePending}
      onApprove={() => {
        if (target) void commandAction.approveScopeProposal(target.id);
      }}
      onReject={(reason) => {
        if (target) void commandAction.rejectScopeProposal(target.id, reason);
      }}
    />
  );
}

function UserCommandDialogs({ dialogs, actions, onOpenChange }: SectionProps) {
  const { activeDialog, target } = dialogs;
  const { commandAction } = actions;
  const targetId = target?.id ?? "none";
  const confirmUnlock = () => {
    if (target) void commandAction.confirm("unlock", target.id);
  };

  return (
    <>
      <UserLockDialog
        key={`lock:${targetId}`}
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
        key={`unlock:${targetId}`}
        open={activeDialog === "unlock"}
        onOpenChange={onOpenChange}
        user={target}
        isPending={commandAction.pending.unlock}
        error={commandAction.error}
        onConfirm={confirmUnlock}
      />
      <UserResetPasswordDialog
        key={`reset:${targetId}`}
        open={activeDialog === "reset"}
        onOpenChange={onOpenChange}
        user={target}
        isPending={commandAction.pending.resetPassword}
        error={commandAction.error}
        onConfirm={(otp) => {
          if (target) void commandAction.confirm("reset-password", target.id, { command: "reset-password", otp });
        }}
      />
    </>
  );
}

export function UserDialogs({ dialogs, actions, merchantId, actorId }: Props) {
  const onOpenChange = (open: boolean) => {
    if (!open) actions.closeAndClear();
  };
  const section = { dialogs, actions, onOpenChange };

  return (
    <>
      <UserFormDialog {...section} merchantId={merchantId} actorId={actorId} />
      <UserDetailDialog {...section} />
      <UserCommandDialogs {...section} />
    </>
  );
}
