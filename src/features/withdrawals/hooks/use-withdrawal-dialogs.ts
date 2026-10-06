import { useState } from "react";
import type { Withdrawal } from "../types/types";

export type WithdrawalDialogName = "create" | "detail";

export function useWithdrawalDialogs() {
  const [activeDialog, setActiveDialog] = useState<WithdrawalDialogName | null>(null);
  const [target, setTarget] = useState<Withdrawal | null>(null);

  const openCreate = () => {
    setTarget(null);
    setActiveDialog("create");
  };
  const openDetail = (withdrawal: Withdrawal) => {
    setTarget(withdrawal);
    setActiveDialog("detail");
  };
  const close = () => {
    setActiveDialog(null);
    setTarget(null);
  };

  return { activeDialog, target, openCreate, openDetail, close };
}

export type WithdrawalDialogs = ReturnType<typeof useWithdrawalDialogs>;
