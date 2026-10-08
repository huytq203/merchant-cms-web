import type { z } from "zod";

import { envelopeSchema } from "@/lib/be/envelope";
import {
  classifyFetchError,
  invalidResponseError,
  toBeError,
  type BeError,
} from "@/lib/be/errors";
import { fail, ok, type Result } from "@/lib/http/result";

export type BeResult<T> = Result<T, BeError>;

type Query = Record<string, string | number | boolean | null | undefined>;

export interface BeRequest<S extends z.ZodType> {
  /** Path including the API prefix, e.g. `/api/v1/merchant/me`. */
  path: string;
  schema: S;
  query?: Query;
  body?: unknown;
  /** Attach the bearer token (default true). */
  auth?: boolean;
}

export interface BeClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null>;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const SENSITIVE_RESPONSE_FIELD = /token|password|secret|otp|^authorization$/i;

function redactResponseForLog(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactResponseForLog);
  if (typeof value !== "object" || value === null) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      SENSITIVE_RESPONSE_FIELD.test(key) ? "[REDACTED]" : redactResponseForLog(nestedValue),
    ]),
  );
}

function logUpstreamResponse(method: string, req: BeRequest<z.ZodType>, response: Response, body: unknown) {
  if (process.env.NODE_ENV !== "development") return;

  console.dir({
    event: "[be] upstream response",
    method,
    path: req.path,
    query: req.query,
    status: response.status,
    body: redactResponseForLog(body),
  }, { depth: null, colors: false });
}

function buildUrl(baseUrl: string, path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  const suffix = params.toString();
  return `${baseUrl}${path}${suffix ? `?${suffix}` : ""}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export function createBeClient(options: BeClientOptions) {
  const { baseUrl, getAccessToken, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  async function buildHeaders(req: BeRequest<z.ZodType>): Promise<Headers> {
    const headers = new Headers({ Accept: "application/json" });
    if (req.body !== undefined) headers.set("Content-Type", "application/json");
    if (req.auth !== false && getAccessToken) {
      const token = await getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  }

  async function request<S extends z.ZodType>(
    method: string,
    req: BeRequest<S>,
  ): Promise<BeResult<z.infer<S>>> {
    let response: Response;
    try {
      response = await fetch(buildUrl(baseUrl, req.path, req.query), {
        method,
        headers: await buildHeaders(req),
        body: req.body === undefined ? undefined : JSON.stringify(req.body),
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const failure = classifyFetchError(error);
      return fail(failure, failure.code);
    }

    const json = await readJson(response);
    logUpstreamResponse(method, req, response, json);
    if (!response.ok) {
      const error = toBeError(response.status, json);
      return fail(error, error.code);
    }

    if (response.status === 204) {
      const data = req.schema.safeParse(undefined);
      if (!data.success) {
        const error = invalidResponseError(response.status);
        return fail(error, error.code);
      }
      return ok(data.data as z.infer<S>);
    }

    if (typeof json === "object" && json !== null && "success" in json && json.success === false) {
      const error = toBeError(response.status, json);
      return fail(error, error.code);
    }

    const envelope = envelopeSchema.safeParse(json === undefined ? { success: true } : json);
    if (!envelope.success) {
      const error = invalidResponseError(response.status);
      return fail(error, error.code);
    }
    if (!envelope.data.success) {
      const error = toBeError(response.status, json);
      return fail(error, error.code);
    }

    const data = req.schema.safeParse(envelope.data.data);
    if (!data.success) {
      if (process.env.NODE_ENV !== "production") {
        const fields = data.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.code}`);
        console.error(`[be] response schema mismatch ${req.path}`, fields.slice(0, 10));
      }
      const error = invalidResponseError(response.status);
      return fail(error, error.code);
    }
    return ok(data.data as z.infer<S>, envelope.data.detail || envelope.data.message || undefined);
  }

  return {
    get: <S extends z.ZodType>(req: BeRequest<S>) => request("GET", req),
    post: <S extends z.ZodType>(req: BeRequest<S>) => request("POST", req),
    put: <S extends z.ZodType>(req: BeRequest<S>) => request("PUT", req),
    patch: <S extends z.ZodType>(req: BeRequest<S>) => request("PATCH", req),
    delete: <S extends z.ZodType>(req: BeRequest<S>) => request("DELETE", req),
  };
}

export type BeClient = ReturnType<typeof createBeClient>;
