import { describe, expect, it } from "vitest";
import { ORDER_CANCEL_CODES } from "@/features/orders/constants/order-cancel";
import { toCancelFailure } from "../order-cancel-error";

const error = (status: number, code: string, message = "be text") => ({ status, code, message });

describe("toCancelFailure", () => {
  it("warns that the order may be paid when the bank does not confirm", () => {
    const failure = toCancelFailure(error(409, "MERCHANT_ORDER_BANK_CANCEL_REJECTED", "Ngân hàng VCB (mã 05)"));
    expect(failure.status).toBe(409);
    expect(failure.body.code).toBe(ORDER_CANCEL_CODES.bankRejected);
    expect(failure.body.message).toContain("đã được thanh toán");
    expect(failure.body.message).not.toContain("05");
  });

  it("treats a bank outage, whatever 5xx the chain used, as not cancelled but possibly paid", () => {
    for (const status of [502, 503, 504]) {
      const failure = toCancelFailure(error(status, `HTTP_${status}`));
      expect(failure).toMatchObject({ status: 503, body: { code: ORDER_CANCEL_CODES.bankUnavailable } });
    }
    expect(toCancelFailure(error(0, "TIMEOUT")).body.code).toBe(ORDER_CANCEL_CODES.bankUnavailable);
  });

  it("maps a state conflict and hides the technical 404 text", () => {
    expect(toCancelFailure(error(409, "MERCHANT_ORDER_NOT_CANCELLABLE"))).toMatchObject({
      status: 409,
      body: { code: ORDER_CANCEL_CODES.notCancellable },
    });
    expect(toCancelFailure(error(404, "RESOURCE_NOT_FOUND", "MerchantOrder không tìm thấy với id : x")).body.message).toBe(
      "Không tìm thấy đơn hàng",
    );
  });

  it("answers a BE 401 as 403 and keeps other messages", () => {
    expect(toCancelFailure(error(401, "HTTP_401")).status).toBe(403);
    expect(toCancelFailure(error(403, "MERCHANT_PERMISSION_DENIED", "Không có quyền thực hiện thao tác"))).toMatchObject({
      status: 403,
      body: { message: "Không có quyền thực hiện thao tác" },
    });
  });
});
