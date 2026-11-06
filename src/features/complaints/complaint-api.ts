import { ApiError, apiClient } from "@/lib/http/api-client";
import { COMPLAINTS_PATH, complaintPath, toComplaintSearchParams } from "./complaint-queries";
import type {
  AttachmentLink,
  Complaint,
  ComplaintListFilter,
  ComplaintReason,
  TransactionCheck,
} from "./types/types";

// Browser calls to the complaint route handlers. Errors are thrown as ApiError whose message is the BE
// Vietnamese `detail` (e.g. 6202/6203/6204/6205, file errors 49xx); callers show it inline or in a toast.

/** Uploads the evidence one by one (the BE takes one file per call) and returns the staging ids in order. */
export async function uploadEvidence(files: File[]): Promise<string[]> {
  const ids: string[] = [];
  for (const file of files) {
    const form = new FormData();
    form.set("file", file);
    const { attachmentId } = await apiClient.post<{ attachmentId: string }>(`${COMPLAINTS_PATH}/attachments`, form, {
      toast: false,
    });
    ids.push(attachmentId);
  }
  return ids;
}

/**
 * Asks the BE whether the typed code is a transaction of this merchant. Rejects with an ApiError carrying the BE
 * sentence (e.g. "Mã giao dịch không tồn tại"); no toast, the form shows it under the field.
 */
export function checkComplaintTransaction(transactionCode: string): Promise<TransactionCheck> {
  return apiClient.get<TransactionCheck>(`${COMPLAINTS_PATH}/transaction-check`, {
    query: { transactionCode: transactionCode.trim() },
    toast: false,
  });
}

export type CreateComplaintInput = {
  transactionCode: string;
  reasonCode: ComplaintReason;
  content: string;
  files: File[];
};

/** Upload, then create: the complaint opens in WAITING with a T+3 working day deadline. */
export async function submitComplaint(input: CreateComplaintInput): Promise<Complaint> {
  const attachmentIds = await uploadEvidence(input.files);
  return apiClient.post<Complaint>(
    COMPLAINTS_PATH,
    {
      transactionCode: input.transactionCode.trim(),
      reasonCode: input.reasonCode,
      content: input.content.trim(),
      attachmentIds,
    },
    { toast: false },
  );
}

export async function submitReply(id: string, content: string, files: File[]): Promise<Complaint> {
  const attachmentIds = await uploadEvidence(files);
  return apiClient.post<Complaint>(complaintPath(id, "replies"), { content: content.trim(), attachmentIds }, { toast: false });
}

export function submitReject(id: string, reason: string): Promise<Complaint> {
  return apiClient.post<Complaint>(complaintPath(id, "reject"), { reason: reason.trim() }, { toast: false });
}

export function fetchAttachmentLink(id: string, attachmentId: string): Promise<AttachmentLink> {
  return apiClient.get<AttachmentLink>(complaintPath(id, "attachments", attachmentId, "link"));
}

/** File name from `Content-Disposition`, falling back to a dated default. */
export function fileNameFrom(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim());
    } catch {
      // fall through to the plain name
    }
  }
  return /filename="?([^";]+)"?/i.exec(disposition)?.[1]?.trim() ?? fallback;
}

/** The export query: the list filter without paging. */
export function exportQuery(filter: ComplaintListFilter): URLSearchParams {
  const params = toComplaintSearchParams(filter);
  params.delete("page");
  params.delete("pageSize");
  return params;
}

/**
 * Downloads the CSV of every complaint matching the filter. Read as a blob (not JSON), so it goes through
 * `fetch` directly; the session cookies travel with the same-origin request.
 */
export async function downloadComplaintsCsv(filter: ComplaintListFilter): Promise<void> {
  const query = exportQuery(filter).toString();
  const response = await fetch(`/api${COMPLAINTS_PATH}/export${query ? `?${query}` : ""}`, { credentials: "include" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(response.status, body?.message ?? "Không xuất được file, vui lòng thử lại");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileNameFrom(response.headers.get("content-disposition"), "khieu-nai.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** A readable message for any failure of the calls above. */
export function describeComplaintError(error: unknown): string {
  return error instanceof ApiError && error.message ? error.message : "Không thực hiện được, vui lòng thử lại";
}
