/** Đường trang hiển thị toàn màn hình (ngoài khung CMS, không menu) cho đơn hoặc mã QR tĩnh. */
export const customerDisplayHref = {
  order: (orderId: string) => `/customer-display/order/${encodeURIComponent(orderId)}`,
  staticQr: (staticQrId: string) => `/customer-display/static-qr/${encodeURIComponent(staticQrId)}`,
} as const;

/**
 * Mở màn ở tab/cửa sổ riêng để người đứng quầy kéo sang màn hình phụ quay về phía khách,
 * trong khi tab Portal vẫn giữ nguyên danh sách đang làm.
 */
export function openCustomerDisplay(href: string): void {
  window.open(href, "_blank", "noopener");
}
