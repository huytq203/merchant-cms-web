import type { OrderStatus } from "../schemas/order.schema";

export const ORDER_STEPS = ["Tạo đơn", "Chờ thanh toán", "Đã thanh toán", "Ghi có", "Thành công"] as const;

export type StepState = "done" | "current" | "failed" | "upcoming";

/** Index of the step an order is on; equal to the step count once it has fully succeeded. */
const POSITION: Record<OrderStatus, { current: number; failed?: boolean }> = {
  PENDING: { current: 0 },
  ACTIVE: { current: 1 },
  PAYMENT_CONFIRMED: { current: 2 },
  CREDIT_PENDING: { current: 3 },
  CREDIT_POSTING: { current: 3 },
  CREDIT_RECONCILIATION_REQUIRED: { current: 3, failed: true },
  SUCCESS: { current: ORDER_STEPS.length },
  FAILED: { current: 1, failed: true },
  EXPIRED: { current: 1 },
  CANCELLED: { current: 1, failed: true },
};

export function orderStepStates(status: OrderStatus): StepState[] {
  const { current, failed } = POSITION[status];
  return ORDER_STEPS.map((_, index) => {
    if (index < current) return "done";
    if (index > current) return "upcoming";
    return failed ? "failed" : "current";
  });
}

export type OrderNote = { tone: "info" | "warning" | "danger" | "success"; text: string };

/** What an order's status means for the merchant, and what (if anything) they can do. */
export function orderNote(status: OrderStatus, qrExpired: boolean): OrderNote {
  switch (status) {
    case "PENDING":
      return { tone: "info", text: "Đơn vừa được tạo, hệ thống đang cấp mã QR." };
    case "ACTIVE":
      return qrExpired
        ? { tone: "warning", text: "Mã QR đã hết hạn. Làm mới mã QR để khách thanh toán tiếp." }
        : { tone: "info", text: "Đơn đang chờ khách quét mã QR để thanh toán." };
    case "PAYMENT_CONFIRMED":
    case "CREDIT_PENDING":
    case "CREDIT_POSTING":
      return { tone: "info", text: "Khách đã thanh toán. Hệ thống đang ghi có tiền vào ví của bạn." };
    case "CREDIT_RECONCILIATION_REQUIRED":
      return {
        tone: "warning",
        text: "Flexpay đang đối soát đơn này với ngân hàng. Bạn không cần làm gì, tiền sẽ được ghi có sau khi đối soát xong.",
      };
    case "SUCCESS":
      return { tone: "success", text: "Khách đã thanh toán và tiền đã ghi có vào ví của bạn." };
    case "FAILED":
      return { tone: "danger", text: "Thanh toán không thành công. Bạn có thể tạo đơn mới cho khách." };
    case "EXPIRED":
      return { tone: "warning", text: "Đơn đã hết hạn thanh toán. Hãy tạo đơn mới cho khách." };
    case "CANCELLED":
      return { tone: "info", text: "Đơn đã được huỷ." };
  }
}
