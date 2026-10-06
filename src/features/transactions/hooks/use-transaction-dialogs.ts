import { useState } from "react";
import type { Transaction } from "../types";

export type TransactionDialog = "detail" | "refund" | "reconciliation";

/** One open dialog at a time, always about the same selected transaction. */
export function useTransactionDialogs() {
  const [target, setTarget] = useState<Transaction | null>(null);
  const [activeDialog, setActiveDialog] = useState<TransactionDialog | null>(null);

  const openFor = (dialog: TransactionDialog, transaction: Transaction | null = target) => {
    setTarget(transaction);
    setActiveDialog(dialog);
  };
  const close = () => setActiveDialog(null);

  return { target, activeDialog, openFor, close };
}
