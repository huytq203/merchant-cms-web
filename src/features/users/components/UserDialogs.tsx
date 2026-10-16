"use client";

import type { SessionMerchant } from "@/types/auth";
import { usePreservedValue } from "@/lib/hooks/use-preserved-value";
import type { useUserActions } from "../hooks/use-user-actions";
import { useScopeProposal } from "../hooks/use-scope-proposal";
import type { UserDialogsState } from "../hooks/use-user-dialogs";
import { UserDetailModal } from "./UserDetailModal";
import { UserLockDialog } from "./UserLockDialog";
import { UserModal } from "./UserModal";
import { UserResendActivationDialog } from "./UserResendActivationDialog";
import { UserResetPasswordDialog } from "./UserResetPasswordDialog";
import { UserUnlockDialog } from "./UserUnlockDialog";
import { userStatusOf } from "../utils/user-view";

type Actions = ReturnType<typeof useUserActions>;

interface Props {
  dialogs: UserDialogsState;
  openFor: UserDialogsState["openFor"];
  actions: Actions;
  merchantId: string;
  merchantIds: string[];
  merchants?: SessionMerchant[];
  actorId: string;
  canApproveScope: boolean;
}

interface SectionProps extends Pick<Props, "dialogs" | "actions" | "openFor" | "actorId"> {
  onOpenChange: (open: boolean) => void;
}

function UserFormDialog({ dialogs, actions, onOpenChange, merchantId, merchantIds, merchants, actorId }: SectionProps & Pick<Props, "merchantId" | "merchantIds" | "merchants">) {
  const { activeDialog, target } = dialogs;
  const { saveAction } = actions;

  return (
    <UserModal
      open={activeDialog === "create" || activeDialog === "edit"}
      onOpenChange={onOpenChange}
      merchantId={merchantId}
      merchantIds={merchantIds}
      merchants={merchants}
      actorId={actorId}
      user={activeDialog === "edit" ? target : null}
      isSubmitting={saveAction.isSaving}
      emailError={saveAction.emailError}
      error={saveAction.error}
      onSubmit={(values) => void saveAction.save(target, values)}
    />
  );
}

function UserDetailDialog({ dialogs, actions, openFor, actorId, onOpenChange, merchants, canApproveScope }: SectionProps & Pick<Props, "merchants" | "canApproveScope">) {
  const { target } = dialogs;
  const { commandAction } = actions;
  const shown = usePreservedValue(target);
  const proposal = useScopeProposal(shown?.id, dialogs.activeDialog === "detail");
  const loadError = proposal.error ? proposal.error.message : undefined;
  const reviewId = shown?.id;

  return (
    <UserDetailModal
      open={dialogs.activeDialog === "detail"}
      onOpenChange={onOpenChange}
      user={target}
      actorId={actorId}
      merchants={merchants}
      proposal={proposal.data ?? null}
      proposalError={loadError ?? commandAction.error}
      isPending={commandAction.isScopePending}
      canApproveScope={canApproveScope}
      onApprove={() => {
        if (reviewId) void commandAction.approveScopeProposal(reviewId);
      }}
      onReject={(reason) => {
        if (reviewId) void commandAction.rejectScopeProposal(reviewId, reason);
      }}
      onReset={() => {
        if (target) openFor(userStatusOf(target) === "PENDING" ? "resend" : "reset", target);
      }}
      onToggleLock={() => {
        if (target) openFor(userStatusOf(target) === "LOCKED" ? "unlock" : "lock", target);
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
      <UserResendActivationDialog
        open={activeDialog === "resend"}
        onOpenChange={onOpenChange}
        user={target}
        isPending={commandAction.pending.resendActivation}
        error={commandAction.error}
        onConfirm={() => {
          if (target) void commandAction.confirm("resend-activation", target.id);
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

export function UserDialogs({ dialogs, openFor, actions, merchantId, merchantIds, merchants, actorId, canApproveScope }: Props) {
  const onOpenChange = (open: boolean) => {
    if (!open) actions.closeDialogs();
  };
  const section = { dialogs, actions, openFor, actorId, onOpenChange };

  return (
    <>
      <UserFormDialog {...section} merchantId={merchantId} merchantIds={merchantIds} merchants={merchants} />
      <UserDetailDialog {...section} merchants={merchants} canApproveScope={canApproveScope} />
      <UserCommandDialogs {...section} />
    </>
  );
}
