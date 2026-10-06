import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/http/api-client";
import type { WithdrawalCreateBody, WithdrawalFormData } from "../schemas/withdrawal.schema";
import type { Withdrawal } from "../types/types";
import { WITHDRAWALS_ENDPOINT } from "../withdrawal-queries";

type Attempt = { signature: string; key: string };

const signatureOf = (values: WithdrawalFormData) =>
  JSON.stringify([values.bankAccountId, values.amount, values.reason ?? ""]);

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
      toast.success("Đã gửi yêu cầu rút tiền, đang chờ duyệt");
    },
  });

  const keyFor = (values: WithdrawalFormData): string => {
    const signature = signatureOf(values);
    if (attempt.current?.signature === signature) return attempt.current.key;
    const key = crypto.randomUUID();
    attempt.current = { signature, key };
    return key;
  };

  /** Submitting while a request is in flight returns that same request, so a double click makes one record. */
  const create = (values: WithdrawalFormData): Promise<Withdrawal> => {
    if (inFlight.current) return inFlight.current;
    const request = mutation.mutateAsync({ ...values, idempotencyKey: keyFor(values) }).finally(() => {
      inFlight.current = null;
    });
    inFlight.current = request;
    return request;
  };

  return { create, isPending: mutation.isPending, error: mutation.error, reset: mutation.reset };
}
