import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NOT_IMPLEMENTED_CODE,
  resolveModuleSource,
  toModuleHttpStatus,
  unsupportedResult,
} from "../api-mode";

const MODULES = ["refund", "customer-display"] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveModuleSource", () => {
  it("serves fixtures only when the mode is fixture outside production", () => {
    for (const name of MODULES) {
      expect(
        resolveModuleSource(name, {
          MERCHANT_API_MODE: "fixture",
          NODE_ENV: "development",
        }),
      ).toBe("fixture");
      expect(
        resolveModuleSource(name, {
          MERCHANT_API_MODE: "fixture",
          NODE_ENV: "test",
        }),
      ).toBe("fixture");
    }
  });

  it("never serves fixtures in production, even when the environment says fixture", () => {
    for (const name of MODULES) {
      expect(
        resolveModuleSource(name, {
          MERCHANT_API_MODE: "fixture",
          NODE_ENV: "production",
        }),
      ).toBe("unsupported");
    }
  });

  it("is unsupported for live, unset or unknown modes", () => {
    for (const mode of ["live", undefined, "", "FIXTURE", "true"]) {
      expect(
        resolveModuleSource("refund", {
          MERCHANT_API_MODE: mode,
          NODE_ENV: "development",
        }),
      ).toBe("unsupported");
    }
  });

  it("reads process.env by default", () => {
    vi.stubEnv("MERCHANT_API_MODE", "fixture");
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveModuleSource("refund")).toBe("unsupported");
    vi.stubEnv("NODE_ENV", "development");
    expect(resolveModuleSource("refund")).toBe("fixture");
  });
});

describe("wired modules", () => {
  it("never serves transaction fixtures: the list reads the BE", () => {
    // Cast: the module left the fixture union once GET /api/v1/merchant/transactions existed.
    const transactions = "transactions" as unknown as Parameters<typeof resolveModuleSource>[0];
    expect(resolveModuleSource(transactions, { MERCHANT_API_MODE: "fixture", NODE_ENV: "development" })).toBe(
      "unsupported",
    );
  });

  it("never serves complaint fixtures: the screen reads /api/v1/merchant/complaints", () => {
    // Cast: the module left the fixture union once the complaint API existed.
    const complaints = "complaints" as unknown as Parameters<typeof resolveModuleSource>[0];
    expect(resolveModuleSource(complaints, { MERCHANT_API_MODE: "fixture", NODE_ENV: "development" })).toBe(
      "unsupported",
    );
  });
});

describe("unsupported result", () => {
  it("is a 501 NOT_IMPLEMENTED failure with a safe Vietnamese message", () => {
    const result = unsupportedResult();
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.status).toBe(501);
    expect(result.error.code).toBe(NOT_IMPLEMENTED_CODE);
    expect(result.error.message).toBe("Chức năng chưa được hỗ trợ");
  });

  it("keeps 501 for the route while other BE failures follow the domain mapping", () => {
    const unsupported = unsupportedResult();
    if (unsupported.success) throw new Error("expected failure");
    expect(toModuleHttpStatus(unsupported.error)).toBe(501);
    expect(
      toModuleHttpStatus({ status: 401, code: "UNAUTHORIZED", message: "x" }),
    ).toBe(403);
    expect(
      toModuleHttpStatus({ status: 404, code: "NOT_FOUND", message: "x" }),
    ).toBe(404);
    expect(
      toModuleHttpStatus({ status: 0, code: "NETWORK", message: "x" }),
    ).toBe(502);
  });
});
