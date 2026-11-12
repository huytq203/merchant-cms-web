// Đường BE của màn "Hiển thị cho khách" và QR tĩnh (thiết kế QR ví FlexPay đợt 1, mục 5.2).
// Thiết kế viết tắt `/portal/...`; Portal gọi flex.merchant qua tiền tố `/api/v1/merchant/...` như mọi màn khác.
// BE chưa có trên dev (12/11/2026): đổi tại đây nếu file bàn giao của flex.merchant chốt đường khác.
const ORDERS = "/api/v1/merchant/orders";
const STATIC_QRS = "/api/v1/merchant/static-qrs";
const PUBLIC_DISPLAY = "/public/v1/customer-display";

const seg = (value: string) => encodeURIComponent(value);

export const customerDisplayPaths = {
  order: (orderId: string) => `${ORDERS}/${seg(orderId)}/customer-display`,
  staticQr: (staticQrId: string) => `${STATIC_QRS}/${seg(staticQrId)}/customer-display`,
  /** Không cần đăng nhập: `displayToken` ký HMAC chỉ đọc được trạng thái đúng đơn/mã của nó. */
  status: (displayToken: string) => `${PUBLIC_DISPLAY}/${seg(displayToken)}/status`,
} as const;

export const staticQrPaths = {
  list: STATIC_QRS,
  create: STATIC_QRS,
  detail: (id: string) => `${STATIC_QRS}/${seg(id)}`,
  disable: (id: string) => `${STATIC_QRS}/${seg(id)}/disable`,
  rotate: (id: string) => `${STATIC_QRS}/${seg(id)}/rotate`,
} as const;
