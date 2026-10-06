import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/http/api-client";
import { isUnsupportedError, retryUnlessUnsupported } from "./unsupported";

describe("isUnsupportedError", () => {
  it("is true only for an API error answered with 501", () => {
    expect(isUnsupportedError(new ApiError(501, "x"))).toBe(true);
    expect(isUnsupportedError(new ApiError(502, "x"))).toBe(false);
    expect(isUnsupportedError(new ApiError(403, "x"))).toBe(false);
    expect(isUnsupportedError(new Error("501"))).toBe(false);
    expect(isUnsupportedError(null)).toBe(false);
  });
});

describe("retryUnlessUnsupported", () => {
  it("never retries an unsupported module and retries other failures once", () => {
    expect(retryUnlessUnsupported(0, new ApiError(501, "x"))).toBe(false);
    expect(retryUnlessUnsupported(0, new ApiError(502, "x"))).toBe(true);
    expect(retryUnlessUnsupported(1, new ApiError(502, "x"))).toBe(false);
  });
});
