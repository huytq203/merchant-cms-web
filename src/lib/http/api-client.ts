import { publicEnv } from "@/lib/env/public";

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
  /** Gửi thêm cookie khi gọi từ Server Component (Next.js cookies()). */
  serverCookie?: string;
};

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
): string {
  const rel = path.startsWith("/") ? path : `/${path}`;

  let base: string;
  if (typeof window === "undefined") {
    // Server-side (Server Action, Server Component): dùng absolute URL
    const configuredBase = publicEnv.NEXT_PUBLIC_API_LOGIN_URL.replace(/\/+$/, "");
    if (configuredBase.startsWith("/")) {
      // Relative config → prepend localhost (chỉ dùng trong server action gọi mock)
      base = `http://localhost:3000${configuredBase}`;
    } else {
      base = configuredBase;
    }
  } else {
    // Client-side (browser): LUÔN dùng relative URL → same-origin, không CORS
    base = "/api";
  }

  const url = `${base}${rel}`;
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

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, query, serverCookie, headers, ...rest } = options;
  const finalHeaders = new Headers(headers);

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }
  finalHeaders.set("Accept", "application/json");
  if (serverCookie) finalHeaders.set("Cookie", serverCookie);

  const res = await fetch(buildUrl(path, query), {
    ...rest,
    method,
    headers: finalHeaders,
    credentials: "include",
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (!res.ok) throw await parseError(res);

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
