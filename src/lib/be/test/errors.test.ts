import { describe, expect, it } from "vitest";

import { classifyFetchError, domainErrorMessage, merchantDomainErrorMessage, toBeError, toDomainHttpStatus, toHttpStatus } from "@/lib/be/errors";

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

  it("keeps the Vietnamese detail of a 503 RestApiResponse business error (lỗi chặn có câu riêng)", () => {
    const error = toBeError(503, {
      success: false,
      message: "MERCHANT_DISBURSEMENT_UNAVAILABLE",
      detail: "Chưa đọc được dữ liệu chi hộ từ hệ thống chi, vui lòng thử lại sau ít phút",
      status: "6323",
    });
    expect(error).toEqual({
      status: 503,
      code: "MERCHANT_DISBURSEMENT_UNAVAILABLE",
      message: "Chưa đọc được dữ liệu chi hộ từ hệ thống chi, vui lòng thử lại sau ít phút",
      backendMessage: true,
    });
  });

  it("still hides a 503 body that is not a business error envelope", () => {
    expect(toBeError(503, { error: "Service Unavailable", message: "upstream connect error" }).message)
      .toBe("Hệ thống đang gặp sự cố, vui lòng thử lại sau");
    expect(toBeError(503, undefined).message).toBe("Hệ thống đang gặp sự cố, vui lòng thử lại sau");
    // 500/502/504 không bao giờ lộ câu, kể cả khi có dạng phong bì nghiệp vụ.
    expect(toBeError(500, { message: "INTERNAL_ERROR", detail: "NullPointerException", status: "9999" }).message)
      .toBe("Hệ thống đang gặp sự cố, vui lòng thử lại sau");
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

describe("toDomainHttpStatus", () => {
  it("never answers a domain call with 401, which would log the user out", () => {
    expect(toDomainHttpStatus({ status: 401, code: "HTTP_401", message: "m" })).toBe(403);
    expect(toDomainHttpStatus({ status: 404, code: "X", message: "m" })).toBe(404);
    expect(toDomainHttpStatus({ status: 503, code: "X", message: "m" })).toBe(502);
  });
});

describe("toHttpStatus", () => {
  it("passes 4xx through and turns network and 5xx failures into 502", () => {
    expect(toHttpStatus({ status: 422, code: "X", message: "m" })).toBe(422);
    expect(toHttpStatus({ status: 0, code: "NETWORK", message: "m" })).toBe(502);
    expect(toHttpStatus({ status: 503, code: "X", message: "m" })).toBe(502);
  });
  it("never answers a failure with a success status", () => {
    expect(toHttpStatus({ status: 200, code: "INVALID_RESPONSE", message: "m" })).toBe(502);
  });
});

describe("domainErrorMessage", () => {
  it("replaces the session-expired message of a BE 401 and keeps every other message", () => {
    expect(domainErrorMessage({ status: 401, code: "HTTP_401", message: "Phiên đăng nhập đã hết hạn" })).toBe(
      "Bạn không có quyền thực hiện thao tác này",
    );
    expect(domainErrorMessage({ status: 404, code: "X", message: "Không tìm thấy dữ liệu" })).toBe("Không tìm thấy dữ liệu");
  });
});

describe("merchantDomainErrorMessage", () => {
  it("turns merchant self-management and last-admin failures into actionable Vietnamese copy", () => {
    expect(merchantDomainErrorMessage({ status: 403, code: "FORBIDDEN", message: "Cannot manage yourself" })).toBe(
      "Bạn không thể sửa chính mình",
    );
    expect(merchantDomainErrorMessage({ status: 403, code: "FORBIDDEN", message: "Cannot lock the last merchant administrator" })).toBe(
      "Không thể khoá quản trị viên cuối cùng. Hãy gán quyền quản trị cho người khác trước.",
    );
  });
});
