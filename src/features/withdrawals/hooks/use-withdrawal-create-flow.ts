import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { withdrawalFormSchema } from "../schemas/withdrawal.schema";
import { describeWithdrawalError, readFieldErrors, withdrawalFailureKind } from "../utils/withdrawal-errors";
import { withdrawalBlocker } from "../utils/withdrawal-limits";
import { withdrawalQueries } from "../withdrawal-queries";
import { useCreateWithdrawal, useWithdrawalOtpChallenge } from "./use-withdrawal-mutations";
import type { Withdrawal, WithdrawalBalance, WithdrawalBankOption } from "../types/types";

/** Một Sub mà người dùng được chọn để rút (đã lọc theo phạm vi gán của phiên). */
export type WithdrawalSubChoice = { id: string; label: string };

/**
 * Tài khoản nhận hiệu lực của Sub: tài khoản người dùng đã chọn nếu còn trong danh sách; Sub chỉ có đúng một
 * tài khoản thì lấy luôn; nhiều tài khoản thì lấy tài khoản mặc định. Không có thì để người dùng tự chọn.
 */
function resolveBank(options: readonly WithdrawalBankOption[], chosenId: string): WithdrawalBankOption | undefined {
  return (
    options.find((option) => option.id === chosenId) ??
    (options.length === 1 ? options[0] : options.find((option) => option.isDefault))
  );
}

export type WithdrawalFormFields = {
  subMerchantId: string;
  bankAccountId: string;
  reason: string;
};

export type WithdrawalFormErrors = Partial<Record<keyof WithdrawalFormFields, string>>;
export type WithdrawalCreateStep = "form" | "confirm" | "otp" | "sent";

/** The figures the merchant reviewed. The code and the request are tied to this amount, so a later refetch cannot change them. */
export type WithdrawalStatement = Pick<WithdrawalBalance, "readyAmount" | "setoff" | "fee" | "netReceived" | "zeroNet" | "escrowShortfallAfter">;

const BLANK: WithdrawalFormFields = { subMerchantId: "", bankAccountId: "", reason: "" };

/** BE takes the amount from the Sub's ready rows; the user never types it. */
function parseFields(values: WithdrawalFormFields, amount: number) {
  return withdrawalFormSchema.safeParse({
    bankAccountId: values.bankAccountId,
    amount,
    ...(values.reason.trim() ? { reason: values.reason } : {}),
  });
}

/** Account, review, email code, result. Everything entered survives a rejected send. */
export function useWithdrawalCreateFlow(subChoices: readonly WithdrawalSubChoice[] = []) {
  const [step, setStep] = useState<WithdrawalCreateStep>("form");
  // Người dùng chỉ được gán đúng một Sub thì chọn sẵn, không bắt chọn lại.
  const [rawValues, setValues] = useState<WithdrawalFormFields>({
    ...BLANK,
    subMerchantId: subChoices.length === 1 ? (subChoices[0]?.id ?? "") : "",
  });
  const [errors, setErrors] = useState<WithdrawalFormErrors>({});
  const [statement, setStatement] = useState<WithdrawalStatement | null>(null);
  const [zeroNetAsked, setZeroNetAsked] = useState(false);
  const [zeroNetAccepted, setZeroNetAccepted] = useState(false);
  const [challenge, setChallenge] = useState<SensitiveOtpChallenge | null>(null);
  const [otpFailure, setOtpFailure] = useState<string | null>(null);
  const [created, setCreated] = useState<Withdrawal | null>(null);
  const bankOptions = useQuery(withdrawalQueries.bankOptions(rawValues.subMerchantId));
  const selectedBank = resolveBank(bankOptions.data?.options ?? [], rawValues.bankAccountId);
  // Các bước sau đọc tài khoản hiệu lực (kể cả tài khoản tự chọn), không đọc lựa chọn thô.
  const values: WithdrawalFormFields = { ...rawValues, bankAccountId: selectedBank?.id ?? "" };
  const balance = useQuery(withdrawalQueries.balance(values.subMerchantId));
  const requestOtp = useWithdrawalOtpChallenge();
  const creation = useCreateWithdrawal();
  const blocker = withdrawalBlocker(balance.data);
  const zeroNetRequired = Boolean(statement?.zeroNet) || zeroNetAsked;

  const change = <K extends keyof WithdrawalFormFields>(field: K, value: WithdrawalFormFields[K]) => {
    // Đổi Sub thì bỏ tài khoản đã chọn; tài khoản và số dư của Sub cũ không còn hiển thị (query theo Sub mới).
    setValues((current) => ({ ...current, [field]: value, ...(field === "subMerchantId" ? { bankAccountId: "" } : {}) }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setOtpFailure(null);
    creation.reset();
  };

  const review = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseFields(values, balance.data?.readyAmount ?? 0);
    if (!values.subMerchantId) return setErrors({ subMerchantId: "Chọn Sub-merchant" });
    if (!values.bankAccountId) return setErrors({ bankAccountId: "Chọn tài khoản ngân hàng nhận tiền" });
    if (!balance.data || blocker || !parsed.success) return;
    const { readyAmount, setoff, fee, netReceived, zeroNet, escrowShortfallAfter } = balance.data;
    setStatement({ readyAmount, setoff, fee, netReceived, zeroNet, escrowShortfallAfter });
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
    } else if (kind === "statementChanged" || kind === "nothingReady" || kind === "automaticMode") {
      // 5782: the Sub switched to automatic settlement; reading it again shows the automatic-mode blocker.
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
    subChoices,
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
