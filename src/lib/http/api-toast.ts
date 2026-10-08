import { toast } from "sonner";
import { API_MESSAGE_HEADER } from "@/lib/http/api-message";

/**
 * Per-call control of the global toast on write requests.
 * - omitted: success toast with the BE message, no error toast (callers show errors inline).
 * - `false`: no toast at all, for callers that run their own `toast.*` in try/catch.
 * - string: use that text instead of the BE message.
 * - object: set each side separately; `error: true` shows the error message, a string replaces it.
 *   `fallback` is the success text used only when the BE sent no message.
 */
export type ApiToastOption =
  | false
  | string
  | { success?: string | false; error?: string | boolean; fallback?: string };

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function decodeMessage(response: Response): string | undefined {
  const raw = response.headers.get(API_MESSAGE_HEADER);
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function sideOf(option: ApiToastOption | undefined, side: "success" | "error") {
  if (option === false) return false;
  if (typeof option === "string") return side === "success" ? option : undefined;
  return option?.[side];
}

export function toastSuccess(method: string, response: Response, option?: ApiToastOption): void {
  if (typeof window === "undefined" || !WRITE_METHODS.has(method)) return;
  const custom = sideOf(option, "success");
  if (custom === false) return;
  const fallback = typeof option === "object" ? option.fallback : undefined;
  const message = custom ?? decodeMessage(response) ?? fallback;
  if (message) toast.success(message);
}

export function toastFailure(method: string, errorMessage: string, option?: ApiToastOption): void {
  if (typeof window === "undefined" || !WRITE_METHODS.has(method)) return;
  const custom = sideOf(option, "error");
  if (!custom) return;
  toast.error(typeof custom === "string" ? custom : errorMessage);
}
