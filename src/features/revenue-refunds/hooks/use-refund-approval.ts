"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/http/api-client";
import type { SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import type { RevenueRefund } from "../types";
import { describeRefundError, useRefundOtpStep } from "./use-refund-otp-step";

const path = (id: string, action: string) => `/v1/admin/revenue-refunds/${encodeURIComponent(id)}/${action}`;

/** Review, then the emailed code; approving queues the ledger write and the list picks the result up. */
export function useRefundApproval() {
  const client = useQueryClient();
  const [target, setTarget] = useState<RevenueRefund | null>(null);
  const otp = useRefundOtpStep(() => apiClient.post<SensitiveOtpChallenge>(path(target?.id ?? "", "otp-challenge"), undefined, { toast: false }));
  const approval = useMutation({
    mutationFn: ({ id, code, challenge }: { id: string; code: string; challenge: SensitiveOtpChallenge }) =>
      apiClient.post<RevenueRefund>(path(id, "approve"), { sensitiveOtp: { otpSessionId: challenge.otpSessionId, otp: code } }, { toast: false }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["revenue-refunds"] }),
  });

  const open = (refund: RevenueRefund) => {
    otp.reset();
    approval.reset();
    setTarget(refund);
  };
  const close = () => setTarget(null);

  const approve = async (code: string) => {
    if (!target || !otp.challenge) return;
    otp.setFailure(null);
    try {
      await approval.mutateAsync({ id: target.id, code, challenge: otp.challenge });
      toast.success("Đã phê duyệt, yêu cầu đang được ghi sổ");
      close();
    } catch (error) {
      otp.setFailure(describeRefundError(error));
    }
  };

  return { target, open, close, otp, approve, isApproving: approval.isPending, backToReview: otp.reset };
}

export type RefundApproval = ReturnType<typeof useRefundApproval>;
