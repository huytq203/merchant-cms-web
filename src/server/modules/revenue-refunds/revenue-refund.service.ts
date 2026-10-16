import "server-only";

import { z } from "zod";
import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { sensitiveOtpChallengeSchema, type SensitiveOtp, type SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { revenueRefundSchema } from "@/features/revenue-refunds/schemas";
import type { CreateRefundBody, RefundFilter, RevenueRefund } from "@/features/revenue-refunds/types";

// Merchant Portal endpoints. The list is not paginated (500 newest) and has no GET by id; every
// write needs an OTP bound to that write: orderId + amount to create, the refund id to approve.
const REFUNDS = "/api/v1/merchant/revenue-refunds";
const item = (id: string) => `${REFUNDS}/${encodeURIComponent(id)}`;

export function listRevenueRefunds(filter: RefundFilter): Promise<BeResult<RevenueRefund[]>> {
  return merchantClient().get({ path: REFUNDS, schema: z.array(revenueRefundSchema), query: { status: filter.status, orderId: filter.orderId } });
}

export function requestCreateOtp(orderId: string, amount: number): Promise<BeResult<SensitiveOtpChallenge>> {
  return merchantClient().post({ path: `${REFUNDS}/otp-challenge`, schema: sensitiveOtpChallengeSchema, body: { orderId, amount } });
}

export function createRevenueRefund(body: CreateRefundBody): Promise<BeResult<RevenueRefund>> {
  return merchantClient().post({ path: REFUNDS, schema: revenueRefundSchema, body });
}

export function requestApproveOtp(id: string): Promise<BeResult<SensitiveOtpChallenge>> {
  return merchantClient().post({ path: `${item(id)}/otp-challenge`, schema: sensitiveOtpChallengeSchema });
}

export function approveRevenueRefund(id: string, sensitiveOtp: SensitiveOtp): Promise<BeResult<RevenueRefund>> {
  return merchantClient().post({ path: `${item(id)}/approve`, schema: revenueRefundSchema, body: { sensitiveOtp } });
}
