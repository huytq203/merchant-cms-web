import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { withdrawalFormSchema } from "../schemas/withdrawal.schema";
import { describeWithdrawalError, readFieldErrors, withdrawalFailureKind } from "../utils/withdrawal-errors";
import { withdrawalBlocker } from "../utils/withdrawal-limits";
import { withdrawalQueries } from "../withdrawal-queries";
import { useCreateWithdrawal, useWithdrawalOtpChallenge } from "./use-withdrawal-mutations";
import type { Withdrawal, WithdrawalBalance } from "../types/types";

export type WithdrawalFormFields = {
  bankAccountId: string;
  reason: string;
};

export type WithdrawalFormErrors = Partial<Record<keyof WithdrawalFormFields, string>>;
export type WithdrawalCreateStep = "form" | "confirm" | "otp" | "sent";

/** The figures the merchant reviewed. The code and the request are tied to this amount, so a later refetch cannot change them. */
export type WithdrawalStatement = Pick<WithdrawalBalance, "readyAmount" | "setoff" | "fee" | "netReceived" | "zeroNet">;

const BLANK: WithdrawalFormFields = { bankAccountId: "", reason: "" };

/** BE takes the amount from the Sub's ready rows; the user never types it. */
function parseFields(values: WithdrawalFormFields, amount: number) {
  return withdrawalFormSchema.safeParse({
    bankAccountId: values.bankAccountId,
    amount,
    ...(values.reason.trim() ? { reason: values.reason } : {}),
  });
}

/** Account, review, email code, result. Everything entered survives a rejected send. */
export function useWithdrawalCreateFlow() {
  const [step, setStep] = useState<WithdrawalCreateStep>("form");
  const [values, setValues] = useState<WithdrawalFormFields>(BLANK);
  const [errors, setErrors] = useState<WithdrawalFormErrors>({});
  const [statement, setStatement] = useState<WithdrawalStatement | null>(null);
  const [zeroNetAsked, setZeroNetAsked] = useState(false);
  const [zeroNetAccepted, setZeroNetAccepted] = useState(false);
  const [challenge, setChallenge] = useState<SensitiveOtpChallenge | null>(null);
  const [otpFailure, setOtpFailure] = useState<string | null>(null);
  const [created, setCreated] = useState<Withdrawal | null>(null);
  const bankOptions = useQuery(withdrawalQueries.bankOptions());
  const selectedBank = bankOptions.data?.options.find((option) => option.id === values.bankAccountId);
  const balance = useQuery(withdrawalQueries.balance(selectedBank?.subMerchantId ?? ""));
  const requestOtp = useWithdrawalOtpChallenge();
  const creation = useCreateWithdrawal();
  const blocker = withdrawalBlocker(balance.data);
  const zeroNetRequired = Boolean(statement?.zeroNet) || zeroNetAsked;

  const change = <K extends keyof WithdrawalFormFields>(field: K, value: WithdrawalFormFields[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setOtpFailure(null);
    creation.reset();
  };

  const review = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseFields(values, balance.data?.readyAmount ?? 0);
    if (!values.bankAccountId) return setErrors({ bankAccountId: "Chọn tài khoản ngân hàng nhận tiền" });
    if (!balance.data || blocker || !parsed.success) return;
    const { readyAmount, setoff, fee, netReceived, zeroNet } = balance.data;
    setStatement({ readyAmount, setoff, fee, netReceived, zeroNet });
    setZeroNetAsked(false);
    setZeroNetAccepted(false);
    setOtpFailure(null);
    setErrors({});
    setStep("confirm");
  };

  /** Asks BE to email a code for this account and amount, then shows the code step. A failure stays on the review step. */
  const sendCode = async () => {
    if (!statement || (zeroNetRequired && !zeroNetAccepted)) return;
    setOtpFailure(null);
    try {
      setChallenge(await requestOtp.mutateAsync({ bankAccountId: values.bankAccountId, amount: statement.readyAmount }));
      setStep("otp");
    } catch (error) {
      setOtpFailure(describeWithdrawalError(error));
    }
  };

  /** A refused send goes back to the step that can fix it; a code or amount BE refused never stays on screen as valid. */
  const routeFailure = async (error: unknown) => {
    setOtpFailure(describeWithdrawalError(error));
    const kind = withdrawalFailureKind(error);
    if (kind === "zeroNet") {
      setZeroNetAsked(true);
      setZeroNetAccepted(false);
      setStep("confirm");
    } else if (kind === "statementChanged" || kind === "nothingReady") {
      setStep("form");
      await balance.refetch();
    }
  };

  const confirm = async (otp: string) => {
    if (!statement || !challenge) return;
    const parsed = parseFields(values, statement.readyAmount);
    if (!parsed.success) return;
    setOtpFailure(null);
    try {
      const sensitiveOtp = { otpSessionId: challenge.otpSessionId, otp };
      setCreated(await creation.create(parsed.data, sensitiveOtp, zeroNetRequired && zeroNetAccepted));
      setStep("sent");
    } catch (error) {
      await routeFailure(error);
    }
  };

  const resend = async () => {
    if (!statement) return;
    setOtpFailure(null);
    try {
      setChallenge(await requestOtp.mutateAsync({ bankAccountId: values.bankAccountId, amount: statement.readyAmount }));
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
    blocker,
    statement,
    selectedBank,
    challenge,
    created,
    otpFailure,
    zeroNetRequired,
    zeroNetAccepted,
    isSending: creation.isPending,
    isRequestingCode: requestOtp.isPending,
    change,
    acceptZeroNet: setZeroNetAccepted,
    review,
    sendCode,
    confirm,
    resend,
    back,
  };
}

export type WithdrawalCreateFlow = ReturnType<typeof useWithdrawalCreateFlow>;
