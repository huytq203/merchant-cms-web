import { describe, expect, it } from "vitest";
import type { BeError } from "@/lib/be/errors";
import {
  UNCONFIRMED_MESSAGE,
  createErrorResponse,
  disbursementErrorResponse,
  READ_UNAVAILABLE_MESSAGE,
  inquiryErrorResponse,
  readErrorResponse,
  readFailureMessage,
  requireSubScope,
} from "../disbursement-response";

const be = (status: number, code: string, message = "Thông báo từ BE"): BeError => ({ status, code, message });
const body = async (response: Response) => response.json();

describe("createErrorResponse (chốt chặn chi hai lần)", () => {
  it.each([
    ["500", be(500, "INTERNAL")],
    ["502", be(502, "HTTP_502")],
    ["503", be(503, "MERCHANT_DISBURSEMENT_UNAVAILABLE")],
    ["504", be(504, "HTTP_504")],
    ["timeout", be(0, "TIMEOUT")],
    ["network", be(0, "NETWORK")],
  ])("turns %s into 503 code 6323 with the 'resend the same code' sentence", async (_name, error) => {
    const response = createErrorResponse(error);
    expect(response.status).toBe(503);
    expect(await body(response)).toEqual({ message: UNCONFIRMED_MESSAGE, code: "6323" });
  });

  it("keeps a definite 4xx refusal with the BE Vietnamese message and code", async () => {
    const response = createErrorResponse(be(409, "DISBURSEMENT_REFUSED", "Mã yêu cầu đã được dùng cho lệnh khác"));
    expect(response.status).toBe(409);
    expect(await body(response)).toEqual({ message: "Mã yêu cầu đã được dùng cho lệnh khác", code: "DISBURSEMENT_REFUSED" });
  });

  it("keeps an invalid OTP as a 4xx so the client does not think the order is unconfirmed", async () => {
    const response = createErrorResponse(be(400, "MERCHANT_SENSITIVE_OTP_INVALID", "Mã OTP không đúng hoặc đã hết hạn"));
    expect(response.status).toBe(400);
  });
});

describe("inquiryErrorResponse", () => {
  it("turns a system failure into 503 code 6328", async () => {
    const response = inquiryErrorResponse(be(0, "TIMEOUT"));
    expect(response.status).toBe(503);
    expect((await body(response)).code).toBe("6328");
  });

  it("keeps 429 so the client can tell the user to wait", async () => {
    const response = inquiryErrorResponse(be(429, "MERCHANT_DISBURSEMENT_NAME_INQUIRY_RATE_LIMITED"));
    expect(response.status).toBe(429);
  });
});

describe("disbursementErrorResponse", () => {
  it("includes field errors as details", async () => {
    const response = disbursementErrorResponse({ ...be(400, "VALIDATION"), fieldErrors: { amount: "Số tiền không hợp lệ" } });
    expect(await body(response)).toMatchObject({ details: { amount: "Số tiền không hợp lệ" }, code: "VALIDATION" });
  });
});

describe("lỗi 503 có câu của BE (chốt 20/11: hiện nguyên câu lỗi chặn)", () => {
  const blocked: BeError = { status: 503, code: "MERCHANT_AUTHORIZATION_UNAVAILABLE", message: "Không xác định được quyền truy cập", backendMessage: true };

  it("disbursementErrorResponse giữ 503 và câu BE thay vì 502 câu chung", async () => {
    const response = disbursementErrorResponse(blocked);
    expect(response.status).toBe(503);
    expect(await body(response)).toEqual({ message: "Không xác định được quyền truy cập", code: "MERCHANT_AUTHORIZATION_UNAVAILABLE" });
  });

  it("đọc dữ liệu: câu BE thắng câu 'thử lại sau' chung", async () => {
    const response = readErrorResponse(blocked);
    expect(response.status).toBe(503);
    expect((await body(response)).message).toBe("Không xác định được quyền truy cập");
    expect(readFailureMessage(blocked)).toBe("Không xác định được quyền truy cập");
  });

  it("5xx mất câu (502/timeout) vẫn dùng câu chung như cũ", async () => {
    expect((await body(readErrorResponse(be(502, "HTTP_502")))).message).toBe(READ_UNAVAILABLE_MESSAGE);
    expect(disbursementErrorResponse(be(502, "HTTP_502")).status).toBe(502);
  });

  it("tạo lệnh vẫn đổi mọi 5xx thành 6323 'gửi lại cùng mã' kể cả khi BE có câu: chưa biết lệnh đã lưu chưa", async () => {
    const response = createErrorResponse(blocked);
    expect(response.status).toBe(503);
    expect(await body(response)).toEqual({ message: UNCONFIRMED_MESSAGE, code: "6323" });
  });
});

describe("requireSubScope", () => {
  const user = (subMerchantIds: string[]) => ({ subMerchantIds }) as never;
  it("refuses a Sub outside the session's assigned Subs", () => {
    expect(requireSubScope(user(["a"]), "b")?.status).toBe(403);
  });
  it("lets BE decide when the session has no Sub restriction", () => {
    expect(requireSubScope(user([]), "b")).toBeNull();
    expect(requireSubScope(user(["a"]), "a")).toBeNull();
  });
});
