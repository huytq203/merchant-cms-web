import { describe, expect, it } from "vitest";

import { classifyFetchError, toBeError, toHttpStatus } from "@/lib/be/errors";

describe("toBeError", () => {
  it("reads code and detail from a RestApiResponse error", () => {
    const error = toBeError(401, {
      success: false,
      message: "INVALID_CREDENTIALS",
      detail: "Email hoặc mật khẩu không đúng",
      status: "4001",
    });
    expect(error).toEqual({
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Email hoặc mật khẩu không đúng",
    });
  });

  it("reads errorCode, message and field details from an ErrorResponse", () => {
    const error = toBeError(400, {
      status: 400,
      message: "Dữ liệu không hợp lệ",
      errorCode: "VALIDATION_ERROR",
      details: { email: "Email không hợp lệ", ignored: 5 },
    });
    expect(error).toEqual({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Dữ liệu không hợp lệ",
      fieldErrors: { email: "Email không hợp lệ" },
    });
  });

  it("never exposes the body of a 5xx response", () => {
    const error = toBeError(500, { message: "NullPointerException at X", detail: "stack..." });
    expect(error.message).toBe("Hệ thống đang gặp sự cố, vui lòng thử lại sau");
    expect(JSON.stringify(error)).not.toContain("NullPointerException");
  });

  it("falls back to a status message when the body is not JSON", () => {
    expect(toBeError(403, undefined)).toEqual({
      status: 403,
      code: "HTTP_403",
      message: "Bạn không có quyền thực hiện thao tác này",
    });
  });
});

describe("classifyFetchError", () => {
  it("maps a TimeoutError to TIMEOUT and anything else to NETWORK", () => {
    expect(classifyFetchError(new DOMException("slow", "TimeoutError")).code).toBe("TIMEOUT");
    expect(classifyFetchError(new TypeError("fetch failed")).code).toBe("NETWORK");
  });
});

describe("toHttpStatus", () => {
  it("passes 4xx through and turns network and 5xx failures into 502", () => {
    expect(toHttpStatus({ status: 422, code: "X", message: "m" })).toBe(422);
    expect(toHttpStatus({ status: 0, code: "NETWORK", message: "m" })).toBe(502);
    expect(toHttpStatus({ status: 503, code: "X", message: "m" })).toBe(502);
  });
});
