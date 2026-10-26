import { domainErrorMessage, toDomainHttpStatus, type BeError } from "@/lib/be/errors";
import { ORDER_CANCEL_CODES } from "@/features/orders/constants/order-cancel";

export interface CancelFailure {
  status: number;
  body: { message: string; code?: string };
}

const BANK_REJECTED_MESSAGE =
  "Ngân hàng chưa xác nhận hủy mã QR. Đơn hàng có thể đã được thanh toán, vui lòng kiểm tra lại sau ít phút.";
const BANK_UNAVAILABLE_MESSAGE =
  "Chưa kết nối được ngân hàng để hủy mã QR nên đơn hàng chưa được hủy và có thể đã được thanh toán. Vui lòng kiểm tra lại sau ít phút.";

const UNCERTAIN_CODES = new Set(["NETWORK", "TIMEOUT", "INVALID_RESPONSE"]);

/**
 * Turns a BE failure of the cancel call into a Vietnamese message plus a stable code. The BE sends a generic 503
 * text and a technical class name in its 404, and every VCB reply other than "00" may mean the order was paid,
 * so those texts are chosen here instead of forwarded.
 */
export function toCancelFailure(error: BeError): CancelFailure {
  if (error.code === "MERCHANT_ORDER_BANK_CANCEL_REJECTED") {
    return { status: 409, body: { message: BANK_REJECTED_MESSAGE, code: ORDER_CANCEL_CODES.bankRejected } };
  }
  if (error.code === "MERCHANT_ORDER_NOT_CANCELLABLE") {
    return { status: 409, body: { message: "Chỉ hủy được đơn đang chờ thanh toán", code: ORDER_CANCEL_CODES.notCancellable } };
  }
  if (error.status >= 500 || UNCERTAIN_CODES.has(error.code)) {
    return { status: 503, body: { message: BANK_UNAVAILABLE_MESSAGE, code: ORDER_CANCEL_CODES.bankUnavailable } };
  }
  if (error.status === 404) return { status: 404, body: { message: "Không tìm thấy đơn hàng" } };
  return { status: toDomainHttpStatus(error), body: { message: domainErrorMessage(error) } };
}
