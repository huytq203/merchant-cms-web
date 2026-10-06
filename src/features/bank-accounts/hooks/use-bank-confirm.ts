import { useState } from "react";
import { describeBankError, type BankErrorView } from "../utils/bank-errors";
import type { BankUpdateResponse } from "../types";
import { useDeleteBankAccount, useSetDefaultBankAccount } from "./use-bank-account-mutations";

export type BankConfirmKind = "delete" | "default";

/** Runs the one-click account actions (delete, make default) and keeps their error for the dialog. */
export function useBankConfirm(onDone: (result?: BankUpdateResponse) => void) {
  const remove = useDeleteBankAccount();
  const makeDefault = useSetDefaultBankAccount();
  const [failure, setFailure] = useState<BankErrorView | null>(null);

  const confirm = async (kind: BankConfirmKind, id: string, reason?: string) => {
    setFailure(null);
    try {
      if (kind === "delete") {
        await remove.mutateAsync({ id, reason });
        onDone();
        return;
      }
      onDone(await makeDefault.mutateAsync({ id, reason }));
    } catch (error) {
      setFailure(describeBankError(error));
    }
  };

  return {
    confirm,
    failure,
    clearFailure: () => setFailure(null),
    isPending: remove.isPending || makeDefault.isPending,
  };
}
