/**
 * Các trạng thái của trang duyệt giao diện `/customer-display/demo` (chỉ dev, khi bật fixture).
 * Tách khỏi component client để Server Component của trang đọc được danh sách khi chọn trạng thái từ URL.
 */
export const DEMO_STATES = ["dynamic", "fee", "static", "paid", "expired", "error"] as const;
export type DemoState = (typeof DEMO_STATES)[number];
