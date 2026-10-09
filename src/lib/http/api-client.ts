import { toastFailure, toastSuccess, type ApiToastOption } from "@/lib/http/api-toast";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Toast control for write requests; see {@link ApiToastOption}. */
  toast?: ApiToastOption;
};

/** Browser-only: always same-origin `/api`, so the httpOnly session cookies go along. */
function buildUrl(
  path: string,
  query?: RequestOptions["query"],
): string {
  const url = `/api${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || "Yêu cầu thất bại";
  let code: string | undefined;
  let details: unknown;
  try {
    const data = (await res.json()) as {
      message?: string;
      error?: string;
      code?: string;
      details?: unknown;
    };
    message = data.message ?? data.error ?? message;
    code = data.code;
    details = data.details;
  } catch {
    // body không phải JSON — dùng statusText
  }
  return new ApiError(res.status, message, code, details);
}

const REFRESH_PATH = "/v1/admin/auth/refresh";
const AUTH_PATH_PREFIX = "/v1/admin/auth/";
const SESSION_EXPIRED_URL = "/api/v1/admin/auth/session-expired";

let onSessionExpired: () => void = () => {
  // A full-page load is required: the route handler clears cookies, then redirects. An absolute URL
  // also satisfies @next/next/no-location-assign-relative-destination without disabling the rule.
  window.location.assign(new URL(SESSION_EXPIRED_URL, window.location.origin).href);
};

export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

type RefreshOutcome = "ok" | "rejected" | "unavailable";
let inflightRefresh: Promise<RefreshOutcome> | null = null;

/** One shared refresh for all parallel 401s. */
function refreshSessionOnce(): Promise<RefreshOutcome> {
  inflightRefresh ??= fetch(buildUrl(REFRESH_PATH), { method: "POST", credentials: "include" })
    .then((response): RefreshOutcome => response.ok ? "ok" : response.status === 401 ? "rejected" : "unavailable")
    .catch((): RefreshOutcome => "unavailable")
    .finally(() => {
      inflightRefresh = null;
    });
  return inflightRefresh;
}

function buildInit(method: string, options: RequestOptions): RequestInit {
  const { body, query: _query, headers, toast: _toast, ...rest } = options;
  void _query;
  void _toast;
  const finalHeaders = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }
  finalHeaders.set("Accept", "application/json");
  return {
    ...rest,
    method,
    headers: finalHeaders,
    credentials: "include",
    body:
      body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  };
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.query);
  let res = await fetch(url, buildInit(method, options));

  if (res.status === 401 && !path.startsWith(AUTH_PATH_PREFIX)) {
    const outcome = await refreshSessionOnce();
    if (outcome === "unavailable") throw new ApiError(503, "Không kết nối được máy chủ");
    // Only a rejected refresh ends the session; a 401 after a good refresh is the BE refusing this call.
    if (outcome === "rejected") onSessionExpired();
    else res = await fetch(url, buildInit(method, options));
  }

  if (!res.ok) {
    const error = await parseError(res);
    toastFailure(method, error.message, options.toast);
    throw error;
  }
  toastSuccess(method, res, options.toast);

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined as T;
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};
