"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { walletFormSchema } from "../schemas/enterprise-wallet.schema";
import type { EnterpriseWallet, WalletFormValues } from "../types";
import { hasIdentityChange, identityChanges } from "../utils/kyb-rekyb";
import { needsAuthorizationLetter, walletToFormValues } from "../utils/kyb-mapper";
import { useKybOtpChallenge, useRefreshProfile, useSaveWallet, useSubmitWallet } from "./use-kyb-mutations";
import { runGuarded } from "./run-guarded";
import { useKybStaging } from "./use-kyb-staging";

export type KybStep = "form" | "otp";

export const KYB_STEP_LABELS = ["Khai báo hồ sơ", "Xác thực OTP", "Gửi yêu cầu"] as const;

type Options = {
  merchantId: string;
  wallet: EnterpriseWallet;
  /** `sent`: the dossier went to review. `saved`: a verified dossier changed in a way that needs no review. */
  onSent: (outcome: "sent" | "saved") => void;
};

function useKybFormState(wallet: EnterpriseWallet) {
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: walletToFormValues(wallet),
  });
  const [managerName, legalRepresentativeName] = useWatch({
    control: form.control,
    name: ["managerName", "legalRepresentativeName"],
  });
  const staging = useKybStaging(wallet, needsAuthorizationLetter({ managerName, legalRepresentativeName }));
  return { form, staging };
}

/**
 * Form, then email OTP, then send. A draft or refused dossier is saved first and the OTP confirms the
 * submit. A verified one is sent back to review by the save itself, so the OTP rides on that save.
 */
export function useKybFlow({ merchantId, wallet, onSent }: Options) {
  const verified = wallet.verificationStatus === "VERIFIED";
  const [step, setStep] = useState<KybStep>("form");
  const [challenge, setChallenge] = useState<SensitiveOtpChallenge | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [otpFailure, setOtpFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showGaps, setShowGaps] = useState(false);
  const { form, staging } = useKybFormState(wallet);
  const save = useSaveWallet(wallet);
  const submit = useSubmitWallet(wallet.id);
  const requestOtp = useKybOtpChallenge();
  const refresh = useRefreshProfile(merchantId);
  const values = useWatch({ control: form.control });
  const changes = identityChanges(wallet, {
    legalName: values.legalName ?? "",
    taxCode: values.taxCode ?? "",
    legalRepresentativeName: values.legalRepresentativeName ?? "",
  });

  const phoneChanged = (values.otpPhone ?? "").trim() !== (wallet.otpPhone ?? "");
  const needsOtp = !verified || hasIdentityChange(changes) || phoneChanged;

  const persist = async (current: WalletFormValues) => {
    await save.mutateAsync({ values: current, stagingIds: staging.stagingIds });
    staging.clearStaging();
  };

  const saveDraft = () => runGuarded(setServerError, async () => {
    await persist(form.getValues());
    await refresh();
    toast.success("Đã lưu nháp hồ sơ KYB");
  });

  const goToOtp = form.handleSubmit((current) => runGuarded(setServerError, async () => {
    setShowGaps(true);
    if (staging.missing.length > 0) return;
    if (!needsOtp) {
      await persist(current);
      toast.success("Đã lưu thay đổi hồ sơ KYB");
      onSent("saved");
      await refresh();
      return;
    }
    if (!verified) await persist(current);
    setChallenge(await requestOtp.mutateAsync());
    setStep("otp");
  }));

  const confirm = (otp: string) => runGuarded(setOtpFailure, async () => {
    if (!challenge) return;
    const answer = { otpSessionId: challenge.otpSessionId, otp };
    if (verified) {
      await save.mutateAsync({ values: form.getValues(), stagingIds: staging.stagingIds, otp: answer });
    } else {
      await submit.mutateAsync(answer);
    }
    staging.clearStaging();
    onSent("sent");
    await refresh();
  });

  const resend = () => runGuarded(setOtpFailure, async () => {
    setChallenge(await requestOtp.mutateAsync());
    setNotice("Đã gửi mã mới");
  });

  return {
    step,
    form,
    challenge,
    serverError,
    otpFailure,
    notice,
    verified,
    identityChanges: verified ? changes : null,
    needsOtp,
    willReverify: verified && hasIdentityChange(changes),
    missing: showGaps ? staging.missing : [],
    setStaging: staging.setStaging,
    isSaving: save.isPending || requestOtp.isPending,
    isSending: save.isPending || submit.isPending,
    isResending: requestOtp.isPending,
    saveDraft,
    goToOtp,
    confirm,
    resend,
    backToForm: () => {
      setStep("form");
      setOtpFailure(null);
      setNotice(null);
    },
  };
}
