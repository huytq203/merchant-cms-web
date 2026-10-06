"use client";

import { useBankSaveFlow } from "../hooks/use-bank-save-flow";
import type { BankAccount, BankUpdateResponse } from "../types";
import { BankAccountFormModal } from "./BankAccountFormModal";
import { BankOtpDialog } from "./BankOtpDialog";

type Props = {
  /** The account being edited; null when adding. */
  account: BankAccount | null;
  onSaved: (result: BankUpdateResponse) => void;
  onClose: () => void;
  /** Only an edit can hit a stale version, so only an edit can reload. */
  onReload?: () => void;
};

/** Mounted only while adding or editing, so every attempt starts from a clean flow. */
export function BankAccountSaveFlow({ account, onSaved, onClose, onReload }: Props) {
  const flow = useBankSaveFlow({ account, onSaved });
  const inOtpStep = flow.challenge !== null;

  return (
    <>
      <BankAccountFormModal
        open={!inOtpStep}
        account={account}
        draft={flow.draft}
        isSubmitting={flow.isSaving || flow.isRequestingOtp}
        failure={inOtpStep ? null : flow.failure}
        onSubmit={flow.submit}
        onClose={onClose}
        onReload={onReload}
      />
      <BankOtpDialog
        open={inOtpStep}
        challenge={flow.challenge}
        isSubmitting={flow.isSaving}
        isResending={flow.isRequestingOtp}
        failure={flow.failure}
        notice={flow.notice}
        onSubmit={(otp) => void flow.confirmOtp(otp)}
        onResend={() => void flow.resend()}
        onBack={flow.backToForm}
      />
    </>
  );
}
