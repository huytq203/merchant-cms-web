"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { walletFormSchema } from "../schemas/enterprise-wallet.schema";
import type { EnterpriseWallet, WalletFormValues } from "../types";
import { needsAuthorizationLetter, walletToFormValues } from "../utils/kyb-mapper";
import { useSaveWallet, useSubmitWallet } from "./use-kyb-mutations";
import { runGuarded } from "./run-guarded";
import { useKybStaging } from "./use-kyb-staging";

export type WizardStep = "form" | "review" | "done";

export const WIZARD_STEP_LABELS = ["Khai báo hồ sơ", "Xác nhận", "Gửi yêu cầu"] as const;
export const WIZARD_STEP_ORDER: readonly WizardStep[] = ["form", "review", "done"];

type Options = {
  merchantId: string;
  wallet: EnterpriseWallet;
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
  const staging = useKybStaging(
    wallet,
    needsAuthorizationLetter({ managerName, legalRepresentativeName }),
  );
  return { form, staging };
}

export function useKybWizard({ merchantId, wallet }: Options) {
  const [step, setStep] = useState<WizardStep>("form");
  const [serverError, setServerError] = useState<string | null>(null);
  const [showGaps, setShowGaps] = useState(false);
  const { form, staging } = useKybFormState(wallet);
  const save = useSaveWallet(merchantId, wallet);
  const submit = useSubmitWallet(merchantId, wallet.id);

  const persist = async (current: WalletFormValues) => {
    await save.mutateAsync({ values: current, stagingIds: staging.stagingIds });
    staging.clearStaging();
  };

  const saveDraft = () => runGuarded(setServerError, async () => {
    await persist(form.getValues());
    toast.success("Đã lưu nháp hồ sơ KYB");
  });

  const goToReview = form.handleSubmit((current) => runGuarded(setServerError, async () => {
    setShowGaps(true);
    if (staging.missing.length > 0) return;
    await persist(current);
    setStep("review");
  }));

  const confirmSubmit = () => runGuarded(setServerError, async () => {
    await submit.mutateAsync();
    setStep("done");
  });

  return {
    step,
    form,
    serverError,
    missing: showGaps ? staging.missing : [],
    setStaging: staging.setStaging,
    isSaving: save.isPending,
    isSubmitting: submit.isPending,
    saveDraft,
    goToReview,
    backToForm: () => setStep("form"),
    confirmSubmit,
  };
}
