import { ApiError } from "@/lib/http/api-client";
import type { DocumentType } from "./constants/document-rules";

const BASE = "/api/v1/admin/kyb";

async function readBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function errorMessage(body: unknown): string {
  if (typeof body === "object" && body !== null && "message" in body && typeof body.message === "string") {
    return body.message;
  }
  return "Yêu cầu thất bại";
}

/** JSON request to the KYB routes; a BE 401 is surfaced as an error and never logs the user out. */
export async function kybRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await readBody(response);
  if (!response.ok) throw new ApiError(response.status, errorMessage(body));
  return body as T;
}

export async function uploadKybDocument(file: File, documentType: DocumentType): Promise<string> {
  const form = new FormData();
  form.set("documentType", documentType);
  form.set("file", file);
  const response = await fetch(`${BASE}/documents`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const body = await readBody(response);
  if (!response.ok) throw new ApiError(response.status, errorMessage(body));
  if (typeof body === "object" && body !== null && "stagingId" in body && typeof body.stagingId === "string") {
    return body.stagingId;
  }
  throw new ApiError(502, "Phản hồi tải tệp không hợp lệ");
}
