import { ApiError } from "@/lib/http/api-client";

/** The module answered 501: its BE API is not available yet. */
export function isUnsupportedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 501;
}

/** TanStack `retry`: a module without a BE API is never retried; other failures once. */
export function retryUnlessUnsupported(failureCount: number, error: Error): boolean {
  return !isUnsupportedError(error) && failureCount < 1;
}
