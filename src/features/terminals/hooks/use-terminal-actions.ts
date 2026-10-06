import type { TerminalFormValues } from "../schemas";
import type { TerminalDialogs } from "./use-terminal-dialogs";
import { useLockTerminal, useSaveTerminal, useUnlockTerminal } from "./use-terminal-mutations";

/** Coordinates the terminal mutations with the open dialog; failures stay visible inside the dialog. */
export function useTerminalActions(dialogs: TerminalDialogs) {
  const editingId = dialogs.activeDialog === "edit" ? dialogs.target?.id : undefined;
  const save = useSaveTerminal(editingId);
  const lock = useLockTerminal();
  const unlock = useUnlockTerminal();

  const submitSave = async (values: TerminalFormValues) => {
    try {
      await save.mutate(values);
      dialogs.close();
    } catch {
      // The form stays open and shows save.error.
    }
  };

  const confirmLock = async (reason: string) => {
    if (!dialogs.target) return;
    try {
      await lock.mutate({ id: dialogs.target.id, reason });
      dialogs.close();
    } catch {
      // The dialog stays open and shows lock.error.
    }
  };

  const confirmUnlock = async (reason: string) => {
    if (!dialogs.target) return;
    try {
      await unlock.mutate({ id: dialogs.target.id, reason });
      dialogs.close();
    } catch {
      // The dialog stays open and shows unlock.error.
    }
  };

  const closeDialog = () => {
    save.reset();
    lock.reset();
    unlock.reset();
    dialogs.close();
  };

  return { save, lock, unlock, submitSave, confirmLock, confirmUnlock, closeDialog };
}
