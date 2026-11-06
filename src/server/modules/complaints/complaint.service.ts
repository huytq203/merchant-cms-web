import "server-only";

import { envelopeSchema, pageSchema } from "@/lib/be/envelope";
import { classifyFetchError, invalidResponseError, toBeError } from "@/lib/be/errors";
import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { readAccessToken } from "@/lib/auth/session-cookies";
import { getServerEnv } from "@/lib/env/server";
import { fail, ok } from "@/lib/http/result";
import {
  attachmentLinkSchema,
  attachmentUploadSchema,
  complaintSchema,
  transactionCheckSchema,
} from "@/features/complaints/schemas/complaint.schema";
import type {
  AttachmentLink,
  Complaint,
  ComplaintListFilter,
  ComplaintListResult,
  CreateComplaintBody,
  ReplyComplaintBody,
  TransactionCheck,
} from "@/features/complaints/types/types";
import { toBeComplaintQuery } from "@/features/complaints/utils/complaint-filter";

// Merchant Portal endpoints of flex.merchant. The BE scopes every call by the session (assigned Master or
// Subs) and takes the acting user from the token, so no merchant id ever goes from here.
const COMPLAINTS = "/api/v1/merchant/complaints";
const item = (id: string) => `${COMPLAINTS}/${encodeURIComponent(id)}`;
/** Uploads and the CSV export can be slower than a JSON read. */
const FILE_TIMEOUT_MS = 30_000;

/** Newest first, as the BE always orders it; rows carry no messages. */
export async function listComplaints(filter: ComplaintListFilter): Promise<BeResult<ComplaintListResult>> {
  const result = await merchantClient().get({
    path: COMPLAINTS,
    schema: pageSchema(complaintSchema),
    query: toBeComplaintQuery(filter, { paged: true }),
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

/** Detail with the conversation (oldest first) and the attachments. */
export function getComplaint(id: string): Promise<BeResult<Complaint>> {
  return merchantClient().get({ path: item(id), schema: complaintSchema });
}

/**
 * Checks, while the merchant types the code, that the transaction belongs to them. A code that does not exist and
 * one of another merchant both come back as 6202 with the same Vietnamese sentence.
 */
export function checkTransaction(transactionCode: string): Promise<BeResult<TransactionCheck>> {
  return merchantClient().get({
    path: `${COMPLAINTS}/transaction-check`,
    schema: transactionCheckSchema,
    query: { transactionCode },
  });
}

/** Opens the complaint in WAITING; 6202/6203/6204 come back with the BE Vietnamese sentence. */
export function createComplaint(body: CreateComplaintBody): Promise<BeResult<Complaint>> {
  return merchantClient().post({ path: COMPLAINTS, schema: complaintSchema, body });
}

/** Only while PROCESSING; the complaint then waits on the Admin. */
export function replyComplaint(id: string, body: ReplyComplaintBody): Promise<BeResult<Complaint>> {
  return merchantClient().post({ path: `${item(id)}/replies`, schema: complaintSchema, body });
}

/** Only while PROCESSING; closes the complaint as REJECTED by the merchant. */
export function rejectComplaint(id: string, reason: string): Promise<BeResult<Complaint>> {
  return merchantClient().post({ path: `${item(id)}/reject`, schema: complaintSchema, body: { reason } });
}

/** A read link valid for five minutes, issued only for an attachment of a complaint in scope. */
export function getAttachmentLink(id: string, attachmentId: string): Promise<BeResult<AttachmentLink>> {
  return merchantClient().get({
    path: `${item(id)}/attachments/${encodeURIComponent(attachmentId)}/link`,
    schema: attachmentLinkSchema,
  });
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Stages one evidence file; the returned id is sent with the create or reply within two hours.
 * Multipart, so it bypasses the JSON BE client the same way the KYB document upload does.
 */
export async function uploadAttachment(file: File): Promise<BeResult<string>> {
  const body = new FormData();
  body.set("file", file);
  let response: Response;
  try {
    response = await fetch(`${getServerEnv().MERCHANT_BASE_URL}${COMPLAINTS}/attachments`, {
      method: "POST",
      headers: await authHeaders(),
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(FILE_TIMEOUT_MS),
    });
  } catch (error) {
    const failure = classifyFetchError(error);
    return fail(failure, failure.code);
  }
  const raw: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const failure = toBeError(response.status, raw);
    return fail(failure, failure.code);
  }
  const envelope = envelopeSchema.safeParse(raw);
  const parsed = envelope.success && envelope.data.success ? attachmentUploadSchema.safeParse(envelope.data.data) : null;
  if (!parsed?.success) {
    const failure = invalidResponseError(response.status);
    return fail(failure, failure.code);
  }
  return ok(parsed.data.attachmentId);
}

export type CsvFile = { body: ArrayBuffer; contentType: string; contentDisposition: string | null };

/** CSV (UTF-8 BOM, ≤ 50.000 rows) of every complaint matching the filter, passed through byte for byte. */
export async function exportComplaints(filter: ComplaintListFilter): Promise<BeResult<CsvFile>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(toBeComplaintQuery(filter, { paged: false }))) {
    if (value !== undefined) params.set(key, String(value));
  }
  const suffix = params.toString();
  let response: Response;
  try {
    response = await fetch(`${getServerEnv().MERCHANT_BASE_URL}${COMPLAINTS}/export${suffix ? `?${suffix}` : ""}`, {
      headers: { Accept: "text/csv, application/json", ...(await authHeaders()) },
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
