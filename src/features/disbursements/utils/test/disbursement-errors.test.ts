import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/http/api-client";
import { describeDisbursementError, disbursementFailureKind, isOutcomeUnknown } from "../disbursement-errors";

describe("disbursement errors", () => {
  it("disbursementErrorCodesShowBackendVietnameseMessage", () => {
    // BE trả enum name ở `code` (4xx) và câu tiếng Việt ở `message`: màn hình hiện nguyên văn câu đó.
    const cases: [number, string, string][] = [
      [409, "MERCHANT_DISBURSEMENT_NOT_ENABLED", "Sub-merchant chưa bật dịch vụ Chi hộ"],
      [400, "MERCHANT_DISBURSEMENT_BATCH_INVALID", "File phải đúng mẫu và có từ 1 đến 1.000 dòng"],
      [409, "6325", "Lô không ở trạng thái cho phép gửi"],
      [409, "DISBURSEMENT_REFUSED", "Số dư thu-chi hộ không đủ để chi lệnh này"],
      [422, "DISBURSEMENT_REFUSED", "Số tài khoản người nhận không tồn tại"],
    ];
    for (const [status, code, message] of cases) {
      expect(describeDisbursementError(new ApiError(status, message, code), "create")).toBe(message);
    }
  });

  it("rateLimit429ShowsWaitMessage", () => {
    const text = describeDisbursementError(
      new ApiError(429, "Tra cứu tên người nhận quá nhiều lần", "MERCHANT_DISBURSEMENT_NAME_INQUIRY_RATE_LIMITED"),
      "inquiry",
    );
    expect(text).toMatch(/chờ/);
    // 429 từ tầng khác (không mang mã 6326) cũng báo chờ.
    expect(describeDisbursementError(new ApiError(429, "Thao tác quá nhanh", "HTTP_429"), "create")).toMatch(/chờ/);
    expect(disbursementFailureKind(new ApiError(429, "x", "6326"))).toBe("rateLimited");
  });

  it("error503KeepsSameRequestCodeForRetry: an unconfirmed outcome is recognised and tells to resend with the same code", () => {
    const unconfirmed = new ApiError(503, "Hệ thống đang gặp sự cố", "6323");
    expect(isOutcomeUnknown(unconfirmed)).toBe(true);
    expect(describeDisbursementError(unconfirmed, "create")).toMatch(/cùng mã yêu cầu/);
    // 5xx mất mã (BFF/gateway) và lỗi mạng của trình duyệt cũng là "chưa biết", không phải "bị từ chối".
    expect(isOutcomeUnknown(new ApiError(502, "x", "HTTP_502"))).toBe(true);
    expect(isOutcomeUnknown(new TypeError("Failed to fetch"))).toBe(true);
    // Bị từ chối bằng 4xx là chắc chắn chưa có lệnh: được đổi mã.
    expect(isOutcomeUnknown(new ApiError(409, "Mã yêu cầu đã dùng", "DISBURSEMENT_REFUSED"))).toBe(false);
  });

  it("maps OTP, inquiry-unavailable and not-enabled codes to their kinds", () => {
    expect(disbursementFailureKind(new ApiError(400, "x", "5732"))).toBe("otpInvalid");
    expect(disbursementFailureKind(new ApiError(400, "x", "MERCHANT_SENSITIVE_OTP_REQUIRED"))).toBe("otpRequired");
    expect(disbursementFailureKind(new ApiError(503, "x", "6328"))).toBe("inquiryUnavailable");
    expect(disbursementFailureKind(new ApiError(409, "x", "MERCHANT_DISBURSEMENT_NOT_ENABLED"))).toBe("notEnabled");
    expect(describeDisbursementError(new ApiError(503, "Hệ thống đang gặp sự cố", "HTTP_503"), "inquiry")).toMatch(/tra được tên/);
  });
});
