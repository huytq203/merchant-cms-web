import "server-only";

import type { z } from "zod";
import { envelopeSchema, pageSchema } from "@/lib/be/envelope";
import { classifyFetchError, invalidResponseError, toBeError } from "@/lib/be/errors";
import { fail, ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { merchantClient } from "@/lib/be/services";
import { readAccessToken } from "@/lib/auth/session-cookies";
import { getServerEnv } from "@/lib/env/server";
import { sensitiveOtpChallengeSchema } from "@/lib/schemas/sensitive-otp";
import {
  batchDetailSchema,
  batchListSchema,
  batchSummarySchema,
  batchValidateResultSchema,
  nameInquirySchema,
  orderDetailSchema,
  orderSearchPageSchema,
  overviewSchema,
  previewSchema,
  receivingAccountSchema,
  topupSchema,
  viewSchema,
  type BatchSubmitBody,
} from "@/features/disbursements/schemas/disbursement.schema";
import type {
  CreateBody,
  NameInquiryBody,
  OtpChallengeBody,
  PreviewBody,
  TopupListFilter,
  TopupListResult,
} from "@/features/disbursements/types/types";
import type { OrderExportBodyInput, OrderSearchBodyInput } from "@/features/disbursements/schemas/disbursement-filter.schema";
import { disbursementPaths } from "./disbursement.paths";

export const getDisbursementOverview = (subId: string) =>
  merchantClient().get({ path: disbursementPaths.overview(subId), schema: overviewSchema });

export const inquireRecipientName = (body: NameInquiryBody) =>
  merchantClient().post({ path: disbursementPaths.nameInquiry, schema: nameInquirySchema, body });

export const previewDisbursement = (body: PreviewBody) =>
  merchantClient().post({ path: disbursementPaths.preview, schema: previewSchema, body });

export const requestDisbursementOtp = (body: OtpChallengeBody) =>
  merchantClient().post({ path: disbursementPaths.otpChallenge, schema: sensitiveOtpChallengeSchema, body });

export const createDisbursement = (body: CreateBody) =>
  merchantClient().post({ path: disbursementPaths.create, schema: viewSchema, body });

export const findDisbursement = (subId: string, code: string) =>
  merchantClient().get({ path: disbursementPaths.find(subId, code), schema: viewSchema });

export const getDisbursementBatch = (batchId: string) =>
  merchantClient().get({ path: disbursementPaths.batch(batchId), schema: batchDetailSchema });

export const searchDisbursements = (body: OrderSearchBodyInput) =>
  merchantClient().post({ path: disbursementPaths.search, schema: orderSearchPageSchema, body });

export const getDisbursementOrder = (operationId: string) =>
  merchantClient().get({ path: disbursementPaths.order(operationId), schema: orderDetailSchema });

/** `page` 0-based như BE; `subId` đã được route kiểm phạm vi. */
export const listDisbursementBatches = (query: { page: number; size: number; subId?: string; status?: string }) =>
  merchantClient().get({ path: disbursementPaths.batches, schema: batchListSchema, query });

export const requestBatchOtp = (batchId: string) =>
  merchantClient().post({ path: disbursementPaths.batchOtpChallenge(batchId), schema: sensitiveOtpChallengeSchema, body: undefined });

export const submitDisbursementBatch = (batchId: string, body: BatchSubmitBody) =>
  merchantClient().post({ path: disbursementPaths.batchSubmit(batchId), schema: batchSummarySchema, body });

/** BE đánh số trang từ 1 và trả Spring Page; FE chỉ cần hàng và tổng. */
export async function listDisbursementTopups(subId: string, filter: TopupListFilter): Promise<BeResult<TopupListResult>> {
  const result = await merchantClient().get({
    path: disbursementPaths.topups(subId),
    schema: pageSchema(topupSchema),
    query: { page: filter.page, size: filter.pageSize, status: filter.status },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export const listReceivingAccounts = (subId?: string) =>
  merchantClient().get({
    path: disbursementPaths.receivingAccounts,
    schema: receivingAccountSchema.array(),
    query: { subId },
  });

export type CsvFile = { body: ArrayBuffer; contentType: string; contentDisposition: string | null };

const FILE_TIMEOUT_MS = 30_000;

async function authHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await readAccessToken();
  return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

/** File mẫu / file lỗi của lô / xuất lệnh (POST có thân): chuyển nguyên byte CSV (UTF-8 BOM) từ BE. */
export async function downloadCsv(path: string, post?: { body: unknown }): Promise<BeResult<CsvFile>> {
  let response: Response;
  try {
    response = await fetch(`${getServerEnv().MERCHANT_BASE_URL}${path}`, {
      method: post ? "POST" : "GET",
      headers: await authHeaders({
        Accept: "text/csv, application/json",
        ...(post ? { "Content-Type": "application/json" } : {}),
      }),
      ...(post ? { body: JSON.stringify(post.body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(FILE_TIMEOUT_MS),
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

/** Tải file lô (multipart `subId` + `file`). BE kiểm dung lượng ≤ 2MB, khuôn mẫu và 1–1.000 dòng. */
export async function uploadDisbursementBatch(subId: string, file: File): Promise<BeResult<z.infer<typeof batchValidateResultSchema>>> {
  const form = new FormData();
  form.append("subId", subId);
  form.append("file", file, file.name);
  let response: Response;
  try {
    response = await fetch(`${getServerEnv().MERCHANT_BASE_URL}${disbursementPaths.batchValidate}`, {
      method: "POST",
      headers: await authHeaders({ Accept: "application/json" }),
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(FILE_TIMEOUT_MS),
    });
  } catch (error) {
    const failure = classifyFetchError(error);
    return fail(failure, failure.code);
  }
  const json: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const failure = toBeError(response.status, json);
    return fail(failure, failure.code);
  }
  const envelope = envelopeSchema.safeParse(json);
  const data = envelope.success && envelope.data.success ? batchValidateResultSchema.safeParse(envelope.data.data) : null;
  if (!data?.success) {
    const failure = invalidResponseError(response.status);
    return fail(failure, failure.code);
  }
  return ok(data.data);
}

/** Xuất CSV lệnh theo bộ lọc; BE dựng file (STK che, tối đa 50.000 dòng) và kiểm phạm vi + quyền xuất. */
export const exportDisbursements = (body: OrderExportBodyInput) => downloadCsv(disbursementPaths.export, { body });
