import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { sensitiveOtpChallengeSchema, type SensitiveOtp, type SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import type { WithdrawalCreateBody, WithdrawalFormData, WithdrawalOtpChallengeBody } from "../schemas/withdrawal.schema";
import type { Withdrawal } from "../types/types";
import { WITHDRAWALS_ENDPOINT } from "../withdrawal-queries";

type Attempt = { signature: string; key: string };

const signatureOf = (values: WithdrawalFormData, confirmZeroNet: boolean) =>
  JSON.stringify([values.bankAccountId, values.amount, values.reason ?? "", confirmZeroNet]);

/**
 * The same request content keeps the same idempotency key, so retrying after a lost response
 * replays the BE record instead of creating a second one. Changed content gets a new key.
 */
export function useCreateWithdrawal() {
  const client = useQueryClient();
  const inFlight = useRef<Promise<Withdrawal> | null>(null);
  const attempt = useRef<Attempt | null>(null);
  const mutation = useMutation({
    mutationFn: (body: WithdrawalCreateBody) => apiClient.post<Withdrawal>(WITHDRAWALS_ENDPOINT, body),
    onSuccess: async (withdrawal) => {
      client.setQueryData(["withdrawals", "detail", withdrawal.id], withdrawal);
      await client.invalidateQueries({ queryKey: ["withdrawals", "list"] });
      await client.invalidateQueries({ queryKey: ["withdrawals", "balance"] });
    },
  });

  const keyFor = (values: WithdrawalFormData, confirmZeroNet: boolean): string => {
    const signature = signatureOf(values, confirmZeroNet);
    if (attempt.current?.signature === signature) return attempt.current.key;
    const key = crypto.randomUUID();
    attempt.current = { signature, key };
    return key;
  };

  /** Submitting while a request is in flight returns that same request, so a double click makes one record. */
  const create = (values: WithdrawalFormData, otp: SensitiveOtp, confirmZeroNet = false): Promise<Withdrawal> => {
    if (inFlight.current) return inFlight.current;
    const body = { ...values, idempotencyKey: keyFor(values, confirmZeroNet), otp, ...(confirmZeroNet ? { confirmZeroNet } : {}) };
    const request = mutation.mutateAsync(body).finally(() => {
      inFlight.current = null;
    });
    inFlight.current = request;
    return request;
  };

  return { create, isPending: mutation.isPending, error: mutation.error, reset: mutation.reset };
}

/** Asks BE to email a code tied to one (account, amount) pair; a resend is the same call with the same pair. */
export function useWithdrawalOtpChallenge() {
  return useMutation({
    mutationFn: (body: WithdrawalOtpChallengeBody): Promise<SensitiveOtpChallenge> =>
      apiClient.post(`${WITHDRAWALS_ENDPOINT}/otp-challenge`, body).then((data) => sensitiveOtpChallengeSchema.parse(data)),
  });
}
