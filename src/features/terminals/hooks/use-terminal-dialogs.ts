import { useState } from "react";
import type { TerminalRow } from "../types";

export type TerminalDialogs = ReturnType<typeof useTerminalDialogs>;

type DialogName = "detail" | "edit" | "lock" | "unlock";

export function useTerminalDialogs() {
  const [activeDialog, setActiveDialog] = useState<DialogName | "create" | null>(null);
  const [target, setTarget] = useState<TerminalRow | null>(null);

  const openCreate = () => {
    setTarget(null);
    setActiveDialog("create");
  };
  const openFor = (name: DialogName, row: TerminalRow) => {
    setTarget(row);
    setActiveDialog(name);
  };
  const close = () => {
    setActiveDialog(null);
    setTarget(null);
  };

  return {
    activeDialog,
    target,
    openCreate,
    openFor,
    close,
  };
}
