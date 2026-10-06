"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { merchantFormSchema } from "../schemas/merchant-profile.schema";
import type { MerchantFormValues, MerchantProfile, MerchantStagingIds } from "../types";
import { merchantToFormValues } from "../utils/merchant-mapper";
import { runGuarded } from "./run-guarded";
import { useSaveMerchant, useSubmitMerchant } from "./use-kyb-mutations";

type Options = {
  merchant: MerchantProfile;
  onSubmitted: () => void;
};

export function useMerchantForm({ merchant, onSubmitted }: Options) {
  const [stagingIds, setStagingIds] = useState<MerchantStagingIds>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantFormSchema),
    defaultValues: merchantToFormValues(merchant),
  });
  const save = useSaveMerchant(merchant.id);
  const submit = useSubmitMerchant(merchant.id);

  const setStaging = (key: keyof MerchantStagingIds, ids: string[]) => {
    const next = key === "productImageStagingIds" ? ids : ids[0];
    setStagingIds((current) => ({ ...current, [key]: next }));
  };

  const persist = async (values: MerchantFormValues) => {
    await save.mutateAsync({ values, stagingIds });
    // Staged files are attached once saved; later saves must not resend them.
    setStagingIds({});
  };

  const saveDraft = form.handleSubmit((values) => runGuarded(setServerError, async () => {
    await persist(values);
    toast.success("Đã lưu nháp hồ sơ ĐVCNTT");
  }));

  const sendForApproval = form.handleSubmit((values) => runGuarded(setServerError, async () => {
    await persist(values);
    await submit.mutateAsync();
    toast.success("Đã gửi hồ sơ ĐVCNTT chờ duyệt");
    onSubmitted();
  }));

  return {
    form,
    serverError,
    isBusy: save.isPending || submit.isPending,
    setStaging,
    saveDraft,
    sendForApproval,
  };
}
