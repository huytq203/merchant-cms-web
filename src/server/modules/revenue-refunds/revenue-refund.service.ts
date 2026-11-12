import "server-only";

import { z } from "zod";
import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { sensitiveOtpChallengeSchema, type SensitiveOtp, type SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { readAccessToken } from "@/lib/auth/session-cookies";
import { getServerEnv } from "@/lib/env/server";
import { classifyFetchError, toBeError } from "@/lib/be/errors";
import { fail, ok } from "@/lib/http/result";
import { refundSummarySchema, revenueRefundDetailSchema, revenueRefundSchema } from "@/features/revenue-refunds/schemas";
import type { CreateRefundBody, RefundQuery, RefundSummary, RevenueRefund, RevenueRefundDetail } from "@/features/revenue-refunds/types";
import { refundQueryString } from "@/features/revenue-refunds/utils/refund-query";

// Merchant Portal endpoints. The list is not paginated (500 newest, filters applied in the BE); GET by id serves the detail modal; every
// write needs an OTP bound to that write: orderId + amount to create, the refund id to approve.
const REFUNDS = "/api/v1/merchant/revenue-refunds";
const item = (id: string) => `${REFUNDS}/${encodeURIComponent(id)}`;

/** BE nhận `statuses` dạng danh sách cách nhau bằng dấu phẩy, `from`/`to` là ngày tạo (giờ VN, gồm cả ngày `to`). */
export function listRevenueRefunds(query: RefundQuery): Promise<BeResult<RevenueRefund[]>> {
  return merchantClient().get({ path: REFUNDS, schema: z.array(revenueRefundSchema), query: { ...query } });
}

/** Chi tiết một yêu cầu (mở từ `?detail=`): BE trả 404 "Không tìm thấy lệnh hoàn tiền." khi không thuộc phạm vi của người dùng. */
export function getRevenueRefund(id: string): Promise<BeResult<RevenueRefundDetail>> {
  return merchantClient().get({ path: item(id), schema: revenueRefundDetailSchema });
}

export function getRevenueRefundSummary(query: RefundQuery): Promise<BeResult<RefundSummary>> {
  return merchantClient().get({ path: `${REFUNDS}/summary`, schema: refundSummarySchema, query: { ...query, statuses: undefined } });
}

export type CsvFile = { body: ArrayBuffer; contentType: string; contentDisposition: string | null };

/** CSV (UTF-8 BOM) của mọi yêu cầu khớp bộ lọc, chuyển nguyên byte từ BE. Chậm hơn đọc JSON nên có hạn riêng. */
export async function exportRevenueRefunds(query: RefundQuery): Promise<BeResult<CsvFile>> {
  const token = await readAccessToken();
  const suffix = refundQueryString(query);
  let response: Response;
  try {
    response = await fetch(`${getServerEnv().MERCHANT_BASE_URL}${REFUNDS}/export${suffix ? `?${suffix}` : ""}`, {
      headers: { Accept: "text/csv, application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const failure = classifyFetchError(error);
    return fail(failure, failure.code);
  }
  if (!response.ok) {
    const failure = toBeError(response.status, await response.json().catch(() => undefined));
    return fail(failure, failure.code);
  }
  return ok({
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? "text/csv; charset=utf-8",
    contentDisposition: response.headers.get("content-disposition"),
  });
}

/** Hủy yêu cầu đang Chờ phê duyệt; không cần OTP vì chưa có tiền nào di chuyển. */
export function cancelRevenueRefund(id: string): Promise<BeResult<RevenueRefund>> {
  return merchantClient().post({ path: `${item(id)}/cancel`, schema: revenueRefundSchema });
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
