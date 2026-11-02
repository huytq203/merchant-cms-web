import type { BeResult } from "@/lib/be/client";
import { toDomainHttpStatus, type BeError } from "@/lib/be/errors";
import { fail } from "@/lib/http/result";

/** Modules whose BE API does not exist yet; each can serve static fixtures in development only. */
export type FixtureModule = "refund" | "complaints";

export type ModuleSource = "fixture" | "unsupported";

/** Remove a module from this set when its BE endpoints are wired. */
const FIXTURE_MODULES: ReadonlySet<string> = new Set<FixtureModule>([
  "refund",
  "complaints",
]);

export const NOT_IMPLEMENTED_CODE = "NOT_IMPLEMENTED";

type EnvSource = Record<string, string | undefined>;

/**
 * `fixture` only when MERCHANT_API_MODE is exactly `fixture` and the build is not production.
 * Everything else (live, unset, unknown, production) is `unsupported`: no silent sample data.
 */
export function resolveModuleSource(module: FixtureModule, env: EnvSource = process.env): ModuleSource {
  if (!FIXTURE_MODULES.has(module)) return "unsupported";
  if (env.NODE_ENV === "production") return "unsupported";
  return env.MERCHANT_API_MODE === "fixture" ? "fixture" : "unsupported";
}

export const NOT_IMPLEMENTED_ERROR: BeError = {
  status: 501,
  code: NOT_IMPLEMENTED_CODE,
  message: "Chức năng chưa được hỗ trợ",
};

export function unsupportedResult(): BeResult<never> {
  return fail(NOT_IMPLEMENTED_ERROR, NOT_IMPLEMENTED_CODE);
}

/** Route status for a module failure: keeps 501 (which `toHttpStatus` would turn into 502). */
export function toModuleHttpStatus(error: BeError): number {
  return error.code === NOT_IMPLEMENTED_CODE ? 501 : toDomainHttpStatus(error);
}
