"use client";

import { useQuery } from "@tanstack/react-query";
import { bankAccountQueries } from "../bank-account-queries";
import { useBankConfirm } from "../hooks/use-bank-confirm";
import type { useBankAccountDialogs } from "../hooks/use-bank-account-dialogs";
import { BankAccountSaveFlow } from "./BankAccountSaveFlow";
import { BankConfirmDialog } from "./BankConfirmDialog";
import { BankDetailModal } from "./BankDetailModal";
import { BankLoadErrorDialog } from "./BankLoadErrorDialog";

type Props = { dialogs: ReturnType<typeof useBankAccountDialogs> };

/** Every dialog of the page; the one that is open is chosen by `dialogs.active`. */
export function BankAccountDialogs({ dialogs }: Props) {
  const { active, target, close } = dialogs;
  const editing = active === "edit" && target !== null;
  const detail = useQuery({ ...bankAccountQueries.detail(target?.id ?? ""), enabled: editing });
  const confirm = useBankConfirm(close);
  const closeConfirm = () => {
    confirm.clearFailure();
    close();
  };

  return (
    <>
      {active === "create" && (
        <BankAccountSaveFlow account={null} onSaved={() => close()} onClose={close} />
      )}
      {editing && detail.data && (
        <BankAccountSaveFlow
          key={detail.dataUpdatedAt}
          account={detail.data}
          onSaved={() => close()}
          onClose={close}
          onReload={() => void detail.refetch()}
        />
      )}
      {editing && detail.isError && (
        <BankLoadErrorDialog message={detail.error.message} onRetry={() => void detail.refetch()} onClose={close} />
      )}
      <BankDetailModal account={active === "detail" ? target : null} onClose={close} />
      <BankConfirmDialog
        kind={active === "delete" || active === "default" ? active : null}
        account={target}
        isSubmitting={confirm.isPending}
        failure={confirm.failure}
        onConfirm={(reason) => target && void confirm.confirm(active === "delete" ? "delete" : "default", target.id, reason)}
        onClose={closeConfirm}
      />
    </>
  );
}
