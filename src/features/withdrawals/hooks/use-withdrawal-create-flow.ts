import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { withdrawalFormSchema } from "../schemas/withdrawal.schema";
import { describeWithdrawalError, readFieldErrors, withdrawalFailureKind } from "../utils/withdrawal-errors";
import { withdrawalBlocker } from "../utils/withdrawal-limits";
import { withdrawalQueries } from "../withdrawal-queries";
import { useCreateWithdrawal, useWithdrawalOtpChallenge } from "./use-withdrawal-mutations";
import type { Withdrawal, WithdrawalBalance } from "../types/types";

/** Một Sub mà người dùng được chọn để rút (đã lọc theo phạm vi gán của phiên). */
export type WithdrawalSubChoice = { id: string; label: string };

/**
 * SRS v2 (18/11/2026): mỗi Sub đúng 1 TK nên form chỉ chọn Sub; TK nhận là TK đang gán cho Sub, hiển thị chứ không
 * chọn. Không còn chặn phía FE theo trạng thái TK: Chờ xác minh vẫn rút được, Sub chưa gán TK (5736) hay TK Khóa (5738)
 * do BE trả lời bằng câu tiếng Việt và màn hình hiện nguyên văn.
 */
export type WithdrawalFormFields = {
  subMerchantId: string;
  reason: string;
};

export type WithdrawalFormErrors = Partial<Record<keyof WithdrawalFormFields, string>>;
export type WithdrawalCreateStep = "form" | "confirm" | "otp" | "sent";

/** The figures the merchant reviewed. The code and the request are tied to this amount, so a later refetch cannot change them. */
export type WithdrawalStatement = Pick<WithdrawalBalance, "readyAmount" | "setoff" | "zeroNet" | "escrowShortfallAfter"> & {
  fee: number;
  netReceived: number;
};

const BLANK: WithdrawalFormFields = { subMerchantId: "", reason: "" };

/** BE takes the amount from the Sub's ready rows; the user never types it. The assigned account id goes along when known. */
function parseFields(values: WithdrawalFormFields, bankAccountId: string | undefined, amount: number) {
  return withdrawalFormSchema.safeParse({
    subMerchantId: values.subMerchantId,
    ...(bankAccountId ? { bankAccountId } : {}),
    amount,
    ...(values.reason.trim() ? { reason: values.reason } : {}),
  });
}

/** Account, review, email code, result. Everything entered survives a rejected send. */
export function useWithdrawalCreateFlow(subChoices: readonly WithdrawalSubChoice[] = []) {
  const [step, setStep] = useState<WithdrawalCreateStep>("form");
  // Người dùng chỉ được gán đúng một Sub thì chọn sẵn, không bắt chọn lại.
  const [values, setValues] = useState<WithdrawalFormFields>({
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
  const receivingAccount = useQuery(withdrawalQueries.receivingAccount(values.subMerchantId));
  const account = receivingAccount.data?.account ?? null;
  const accountId = account?.id;
  // Phí xem trước theo ngân hàng của TK đang gán. Chờ biết TK rồi mới hỏi số dư, để chỉ hỏi một lần và kèm id TK.
  const balance = useQuery(withdrawalQueries.balance(values.subMerchantId, accountId ?? "", !receivingAccount.isPending));
  const requestOtp = useWithdrawalOtpChallenge();
  const creation = useCreateWithdrawal();
  const blocker = withdrawalBlocker(balance.data);
  const zeroNetRequired = Boolean(statement?.zeroNet) || zeroNetAsked;

  const change = <K extends keyof WithdrawalFormFields>(field: K, value: WithdrawalFormFields[K]) => {
    // Đổi Sub thì TK và số dư hiển thị theo Sub mới (query theo Sub), không giữ gì của Sub cũ.
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setOtpFailure(null);
    creation.reset();
  };

  const review = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseFields(values, accountId, balance.data?.readyAmount ?? 0);
    if (!values.subMerchantId) return setErrors({ subMerchantId: "Chọn Sub-merchant" });
    // Sub chưa gán TK: không có nơi nhận tiền, BE đã/ sẽ báo 5736 ở khung số dư.
    if (!account || !balance.data || blocker || !parsed.success) return;
    const { readyAmount, setoff, fee, netReceived, zeroNet, escrowShortfallAfter } = balance.data;
    // Phí chưa biết (chưa có TK) luôn đi kèm blocker nên không tới đây; giữ chặn để bước xem lại không hiện số đoán.
    if (fee === null || netReceived === null) return;
    setStatement({ readyAmount, setoff, fee, netReceived, zeroNet, escrowShortfallAfter });
    setZeroNetAsked(false);
    setZeroNetAccepted(false);
    setOtpFailure(null);
    setErrors({});
    setStep("confirm");
  };

  /** The code is tied to (Sub, amount); the assigned account id rides along so BE can check it is still the Sub's account. */
  const challengeBody = (amount: number) => ({ subMerchantId: values.subMerchantId, ...(accountId ? { bankAccountId: accountId } : {}), amount });

  /** Asks BE to email a code for this Sub and amount, then shows the code step. A failure stays on the review step. */
  const sendCode = async () => {
    if (!statement || (zeroNetRequired && !zeroNetAccepted)) return;
    setOtpFailure(null);
    try {
      setChallenge(await requestOtp.mutateAsync(challengeBody(statement.readyAmount)));
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
    } else if (kind === "bankAccountRequired" || kind === "accountLocked") {
      // 5736/5738: the Sub's account was removed or locked meanwhile; back to step 1, which shows the account again
      // and keeps the BE message on screen.
      setStep("form");
      await Promise.all([receivingAccount.refetch(), balance.refetch()]);
    }
  };

  const confirm = async (otp: string) => {
    if (!statement || !challenge) return;
    const parsed = parseFields(values, accountId, statement.readyAmount);
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
      setChallenge(await requestOtp.mutateAsync(challengeBody(statement.readyAmount)));
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
    receivingAccount,
    account,
    balance,
    blocker,
    statement,
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
