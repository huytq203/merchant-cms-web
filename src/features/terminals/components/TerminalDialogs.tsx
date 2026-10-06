"use client";

import { useQuery } from "@tanstack/react-query";
import { terminalQueries } from "../terminal-queries";
import type { useTerminalActions } from "../hooks/use-terminal-actions";
import type { TerminalDialogs as Dialogs } from "../hooks/use-terminal-dialogs";
import { TerminalDetailModal } from "./TerminalDetailModal";
import { TerminalFormModal } from "./TerminalFormModal";
import { TerminalLockModal } from "./TerminalLockModal";

type Props = {
  dialogs: Dialogs;
  actions: ReturnType<typeof useTerminalActions>;
};

export function TerminalDialogs({ dialogs, actions }: Props) {
  const { activeDialog, target } = dialogs;
  const detail = useQuery({
    ...terminalQueries.detail(target?.id ?? ""),
    enabled: Boolean(target) && (activeDialog === "edit" || activeDialog === "detail"),
  });
  const onOpenChange = (open: boolean) => {
    if (!open) actions.closeDialog();
  };
  const isEditing = activeDialog === "edit";
  const isUnlocking = activeDialog === "unlock";
  const lockMutation = isUnlocking ? actions.unlock : actions.lock;

  return (
    <>
      <TerminalDetailModal
        title={isEditing ? "Sửa Terminal" : undefined}
        open={activeDialog === "detail" || (isEditing && !detail.data)}
        onOpenChange={onOpenChange}
        detail={detail.data}
        error={detail.error?.message}
      />
      {(activeDialog === "create" || (isEditing && detail.data)) && (
        <TerminalFormModal
          key={detail.data?.id ?? "create"}
          open
          onOpenChange={onOpenChange}
          detail={isEditing ? detail.data : null}
          onSubmit={actions.submitSave}
          isSubmitting={actions.save.isPending}
          error={actions.save.error?.message}
        />
      )}
      <TerminalLockModal
        open={activeDialog === "lock" || isUnlocking}
        onOpenChange={onOpenChange}
        target={target}
        action={isUnlocking ? "unlock" : "lock"}
        onConfirm={isUnlocking ? actions.confirmUnlock : actions.confirmLock}
        isSubmitting={lockMutation.isPending}
        error={lockMutation.error?.message}
      />
    </>
  );
}
