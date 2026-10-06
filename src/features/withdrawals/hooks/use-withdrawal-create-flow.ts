import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { withdrawalFormSchema } from "../schemas/withdrawal.schema";
import { describeWithdrawalError, readFieldErrors } from "../utils/withdrawal-errors";
import { withdrawalQueries } from "../withdrawal-queries";
import { useCreateWithdrawal } from "./use-withdrawal-mutations";

export type WithdrawalFormFields = {
  subMerchantId: string;
  bankAccountId: string;
  amount: string;
  reason: string;
};

export type WithdrawalFormErrors = Partial<Record<keyof WithdrawalFormFields, string>>;
export type WithdrawalCreateStep = 1 | 2;

const BLANK: WithdrawalFormFields = { subMerchantId: "", bankAccountId: "", amount: "", reason: "" };

function parseFields(values: WithdrawalFormFields) {
  return withdrawalFormSchema.safeParse({
    bankAccountId: values.bankAccountId,
    amount: values.amount,
    ...(values.reason.trim() ? { reason: values.reason } : {}),
  });
}

function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]): WithdrawalFormErrors {
  const next: WithdrawalFormErrors = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in next)) next[field as keyof WithdrawalFormFields] = issue.message;
  }
  return next;
}

/** Two-step create flow: collect the request, review it, then send it. Data survives a rejected send. */
export function useWithdrawalCreateFlow(onCreated: () => void) {
  const [step, setStep] = useState<WithdrawalCreateStep>(1);
  const [values, setValues] = useState<WithdrawalFormFields>(BLANK);
  const [errors, setErrors] = useState<WithdrawalFormErrors>({});
  const subMerchants = useSubMerchantOptions();
  const bankOptions = useQuery(withdrawalQueries.bankOptions(values.subMerchantId));
  const creation = useCreateWithdrawal();
  const selectedBank = bankOptions.data?.options.find((option) => option.id === values.bankAccountId);
  const selectedSubMerchant = subMerchants.data?.find((option) => option.id === values.subMerchantId);

  const change = <K extends keyof WithdrawalFormFields>(field: K, value: WithdrawalFormFields[K]) => {
    const resetsBank = field === "subMerchantId" ? { bankAccountId: "" } : {};
    setValues((current) => ({ ...current, ...resetsBank, [field]: value }));
    setErrors((current) => ({ ...current, ...resetsBank, [field]: undefined }));
    creation.reset();
  };

  const review = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseFields(values);
    setErrors(parsed.success ? {} : issuesToErrors(parsed.error.issues));
    if (parsed.success) setStep(2);
  };

  const submit = async () => {
    const parsed = parseFields(values);
    if (!parsed.success) {
      setErrors(issuesToErrors(parsed.error.issues));
      setStep(1);
      return;
    }
    try {
      await creation.create(parsed.data);
      onCreated();
    } catch {
      // The review step stays open and shows the server error.
    }
  };

  const back = () => {
    creation.reset();
    setStep(1);
  };

  return {
    step,
    values,
    errors: { ...readFieldErrors(creation.error), ...errors },
    subMerchants,
    bankOptions,
    selectedBank,
    selectedSubMerchant,
    isSubmitting: creation.isPending,
    submitError: creation.error ? describeWithdrawalError(creation.error) : undefined,
    change,
    review,
    submit,
    back,
  };
}

export type WithdrawalCreateFlow = ReturnType<typeof useWithdrawalCreateFlow>;
