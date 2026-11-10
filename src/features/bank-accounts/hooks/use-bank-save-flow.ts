import { useState } from "react";
import { describeBankError, type BankErrorView } from "../utils/bank-errors";
import { isBankIdentityChanged, toCreateBankRequest, toUpdateBankRequest } from "../utils/bank-mapper";
import type { BankAccount, BankAccountFormValues, BankOtpChallenge, BankUpdateResponse } from "../types";
import { useBankOtpChallenge, useCreateBankAccount, useUpdateBankAccount } from "./use-bank-account-mutations";

type Options = {
  /** The account being edited; null when adding a new one. */
  account: BankAccount | null;
  onSaved: (result: BankUpdateResponse) => void;
};

type OtpAnswer = { otpSessionId: string; otp: string };

/**
 * Orchestrates add/edit: form -> (OTP challenge -> code) -> save.
 * A new account and a change of bank, number or holder need the OTP; other edits save directly.
 */
export function useBankSaveFlow({ account, onSaved }: Options) {
  const [draft, setDraft] = useState<BankAccountFormValues | null>(null);
  const [challenge, setChallenge] = useState<BankOtpChallenge | null>(null);
  const [failure, setFailure] = useState<BankErrorView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const requestChallenge = useBankOtpChallenge();
  const create = useCreateBankAccount();
  const update = useUpdateBankAccount();

  const save = async (values: BankAccountFormValues, answer: OtpAnswer | null) => {
    const sessionId = answer?.otpSessionId ?? null;
    const code = answer?.otp ?? null;
    const result = account
      ? await update.mutateAsync({ id: account.id, request: toUpdateBankRequest(values, account, sessionId, code) })
      : await create.mutateAsync(toCreateBankRequest(values, sessionId, code));
    onSaved(result);
  };

  const run = async (action: () => Promise<void>) => {
    setFailure(null);
    setNotice(null);
    try {
      await action();
    } catch (error) {
      const view = describeBankError(error);
      setFailure(view);
      // Bản cũ, hoặc tên chủ TK bị ngân hàng/KYB từ chối: đóng bước OTP, quay lại form (dữ liệu nháp giữ nguyên) để
      // người dùng sửa; lỗi tên hiện ngay ô Chủ tài khoản. Lần lưu sau xin mã OTP mới.
      if (view.kind === "conflict" || view.kind === "holderName") setChallenge(null);
    }
  };

  const askOtp = async () => setChallenge(await requestChallenge.mutateAsync(account?.id));

  const submit = (values: BankAccountFormValues) => run(async () => {
    setDraft(values);
    if (account && !isBankIdentityChanged(account, values)) return save(values, null);
    await askOtp();
  });

  const confirmOtp = (otp: string) => run(async () => {
    if (!draft || !challenge) return;
    await save(draft, { otpSessionId: challenge.otpSessionId, otp });
  });

  const resend = () => run(async () => {
    await askOtp();
    setNotice("Đã gửi mã mới");
  });

  const backToForm = () => {
    setChallenge(null);
    setFailure(null);
    setNotice(null);
  };

  return {
    draft,
    challenge,
    failure,
    notice,
    isSaving: create.isPending || update.isPending,
    isRequestingOtp: requestChallenge.isPending,
    submit,
    confirmOtp,
    resend,
    backToForm,
  };
}
