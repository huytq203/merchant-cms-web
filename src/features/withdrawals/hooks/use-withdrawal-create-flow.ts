import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { withdrawalFormSchema } from "../schemas/withdrawal.schema";
import { describeWithdrawalError, readFieldErrors } from "../utils/withdrawal-errors";
import { amountProblem, maxWithdrawable } from "../utils/withdrawal-limits";
import { withdrawalQueries } from "../withdrawal-queries";
import { useCreateWithdrawal, useWithdrawalOtpChallenge } from "./use-withdrawal-mutations";
import type { Withdrawal } from "../types/types";

export type WithdrawalFormFields = {
  bankAccountId: string;
  amount: string;
  reason: string;
};

export type WithdrawalFormErrors = Partial<Record<keyof WithdrawalFormFields, string>>;
export type WithdrawalCreateStep = "form" | "confirm" | "otp" | "sent";

const BLANK: WithdrawalFormFields = { bankAccountId: "", amount: "", reason: "" };

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

/** Form, review, email code, result. Everything entered survives a rejected send. */
export function useWithdrawalCreateFlow() {
  const [step, setStep] = useState<WithdrawalCreateStep>("form");
  const [values, setValues] = useState<WithdrawalFormFields>(BLANK);
  const [errors, setErrors] = useState<WithdrawalFormErrors>({});
  const [challenge, setChallenge] = useState<SensitiveOtpChallenge | null>(null);
  const [otpFailure, setOtpFailure] = useState<string | null>(null);
  const [created, setCreated] = useState<Withdrawal | null>(null);
  const bankOptions = useQuery(withdrawalQueries.bankOptions());
  const balance = useQuery(withdrawalQueries.balance());
  const requestOtp = useWithdrawalOtpChallenge();
  const creation = useCreateWithdrawal();
  const selectedBank = bankOptions.data?.options.find((option) => option.id === values.bankAccountId);

  const change = <K extends keyof WithdrawalFormFields>(field: K, value: WithdrawalFormFields[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    creation.reset();
  };

  const fillMaximum = () => {
    if (balance.data) change("amount", String(maxWithdrawable(balance.data)));
  };

  const review = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseFields(values);
    if (!parsed.success) return setErrors(issuesToErrors(parsed.error.issues));
    const problem = amountProblem(parsed.data.amount, balance.data);
    if (problem) return setErrors({ amount: problem });
    setErrors({});
    setStep("confirm");
  };

  /** Asks BE to email a code, then shows the code step. A failure stays on the review step. */
  const sendCode = async () => {
    setOtpFailure(null);
    try {
      setChallenge(await requestOtp.mutateAsync());
      setStep("otp");
    } catch (error) {
      setOtpFailure(describeWithdrawalError(error));
    }
  };

  const confirm = async (otp: string) => {
    const parsed = parseFields(values);
    if (!parsed.success || !challenge) return;
    setOtpFailure(null);
    try {
      setCreated(await creation.create(parsed.data, { otpSessionId: challenge.otpSessionId, otp }));
      setStep("sent");
    } catch (error) {
      setOtpFailure(describeWithdrawalError(error));
    }
  };

  const resend = async () => {
    setOtpFailure(null);
    try {
      setChallenge(await requestOtp.mutateAsync());
    } catch (error) {
      setOtpFailure(describeWithdrawalError(error));
    }
  };

  const back = () => {
    creation.reset();
    setOtpFailure(null);
    setStep(step === "otp" ? "confirm" : "form");
  };

  return {
    step,
    values,
    errors: { ...readFieldErrors(creation.error), ...errors },
    bankOptions,
    balance,
    selectedBank,
    challenge,
    created,
    otpFailure,
    isSending: creation.isPending,
    isRequestingCode: requestOtp.isPending,
    change,
    fillMaximum,
    review,
    sendCode,
    confirm,
    resend,
    back,
  };
}

export type WithdrawalCreateFlow = ReturnType<typeof useWithdrawalCreateFlow>;
