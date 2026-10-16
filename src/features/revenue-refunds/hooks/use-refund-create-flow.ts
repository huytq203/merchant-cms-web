"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiClient } from "@/lib/http/api-client";
import type { SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { createRefundFormSchema } from "../schemas";
import type { CreateRefundForm, RevenueRefund } from "../types";
import { describeRefundError, useRefundOtpStep } from "./use-refund-otp-step";

export type RefundFormFields = Record<"amount" | "reason" | "beneficiaryBankCode" | "beneficiaryAccountNumber" | "beneficiaryAccountName", string>;
export type RefundFormErrors = Partial<Record<keyof RefundFormFields, string>>;
export type RefundCreateStep = "form" | "otp" | "done";

const BLANK: RefundFormFields = { amount: "", reason: "", beneficiaryBankCode: "", beneficiaryAccountNumber: "", beneficiaryAccountName: "" };
const ROOT = "/v1/admin/revenue-refunds";
/** Failures the user fixes in the form rather than on the code step. */
const FORM_ERRORS = new Set(["MERCHANT_REFUND_EXCEEDS_PAYMENT", "MERCHANT_REFUND_NOT_REFUNDABLE", "VALIDATION_ERROR"]);

function validate(values: RefundFormFields, orderAmount: number): { data?: CreateRefundForm; errors: RefundFormErrors } {
  const parsed = createRefundFormSchema.safeParse({ ...values, amount: values.amount.replace(/\D/g, "") || "0" });
  if (!parsed.success) {
    const errors: RefundFormErrors = {};
    for (const issue of parsed.error.issues) errors[issue.path[0] as keyof RefundFormFields] ??= issue.message;
    return { errors };
  }
  if (parsed.data.amount > orderAmount) {
    return { errors: { amount: `Không vượt quá ${new Intl.NumberFormat("vi-VN").format(orderAmount)} vnđ giá trị giao dịch.` } };
  }
  return { data: parsed.data, errors: {} };
}

/** Form, then review with the code bound to this order and amount, then the result. Entries survive a failure. */
export function useRefundCreateFlow(order: { id: string; amount: number }) {
  const client = useQueryClient();
  const [step, setStep] = useState<RefundCreateStep>("form");
  const [values, setValues] = useState<RefundFormFields>(BLANK);
  const [errors, setErrors] = useState<RefundFormErrors>({});
  const [draft, setDraft] = useState<CreateRefundForm | null>(null);
  const [created, setCreated] = useState<RevenueRefund | null>(null);
  const otp = useRefundOtpStep((amount: number) =>
    apiClient.post<SensitiveOtpChallenge>(`${ROOT}/otp-challenge`, { orderId: order.id, amount }, { toast: false }));
  const creation = useMutation({
    mutationFn: ({ form, otp: code, challenge }: { form: CreateRefundForm; otp: string; challenge: SensitiveOtpChallenge }) =>
      apiClient.post<RevenueRefund>(ROOT, { orderId: order.id, ...form, sensitiveOtp: { otpSessionId: challenge.otpSessionId, otp: code } }, { toast: false }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["revenue-refunds"] }),
  });

  const change = (field: keyof RefundFormFields, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const review = async () => {
    const result = validate(values, order.amount);
    setErrors(result.errors);
    if (!result.data) return;
    setDraft(result.data);
    if (await otp.send(result.data.amount)) setStep("otp");
  };

  const submit = async (code: string) => {
    if (!draft || !otp.challenge) return;
    otp.setFailure(null);
    try {
      setCreated(await creation.mutateAsync({ form: draft, otp: code, challenge: otp.challenge }));
      setStep("done");
    } catch (error) {
      if (error instanceof ApiError && error.code && FORM_ERRORS.has(error.code)) {
        otp.reset();
        setErrors({ amount: error.message });
        setStep("form");
        return;
      }
      otp.setFailure(describeRefundError(error));
    }
  };

  const back = () => {
    otp.reset();
    setStep("form");
  };

  return { step, values, errors, draft, created, otp, change, review, submit, back, isSubmitting: creation.isPending };
}

export type RefundCreateFlow = ReturnType<typeof useRefundCreateFlow>;
