import "server-only";
import { z } from "zod";

/** Trims slashes and drops a trailing API namespace; code selects the namespace. */
const normalizeBaseUrl = (value: string) =>
  value
    .replace(/\/+$/, "")
    .replace(/\/api\/v1\/(?:admin|merchant)$/, "")
    .replace(/\/+$/, "");

const serverEnvSchema = z.object({
  IDENTITY_BASE_URL: z.url().transform(normalizeBaseUrl),
  MERCHANT_BASE_URL: z.url().transform(normalizeBaseUrl),
  MERCHANT_API_MODE: z.enum(["live", "fixture"]).default("fixture"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    const keys = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Invalid server environment: ${keys.join(", ")}`);
  }
  return parsed.data;
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
