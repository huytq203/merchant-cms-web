import { ApiError } from "@/lib/http/api-client";

function readMessage(body: unknown): string {
  if (typeof body === "object" && body !== null && "message" in body && typeof body.message === "string") {
    return body.message;
  }
  return "Yêu cầu thất bại";
}

function readCode(body: unknown): string | undefined {
  return typeof body === "object" && body !== null && "code" in body && typeof body.code === "string" ? body.code : undefined;
}

function readDetails(body: unknown): unknown {
  return typeof body === "object" && body !== null && "details" in body ? body.details : undefined;
}

export async function orderRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/admin/orders${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, readMessage(body), readCode(body), readDetails(body));
  }
  return body as T;
}

/** Field-level errors the BE attached to a rejected request, keyed by field name. */
export function readFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || typeof error.details !== "object" || error.details === null) return {};
  const entries = Object.entries(error.details).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return Object.fromEntries(entries);
}
