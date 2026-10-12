import type { OrderStatus } from "@/features/orders/types/types";

export type OrderBucket = "paid" | "waiting" | "failed" | "closed";

/** The ten order statuses, merged into the four a merchant reads at a glance. */
export const ORDER_BUCKETS: {
  key: OrderBucket;
  label: string;
  /** Chart colour: system chart tokens, so it follows the theme. */
  color: string;
  statuses: readonly OrderStatus[];
}[] = [
  { key: "paid", label: "Đã thanh toán", color: "var(--chart-4)", statuses: ["SUCCESS", "PAYMENT_CONFIRMED", "CREDIT_PENDING", "CREDIT_POSTING"] },
  { key: "waiting", label: "Chờ thanh toán", color: "var(--chart-2)", statuses: ["PENDING", "ACTIVE"] },
  { key: "failed", label: "Thất bại hoặc cần đối soát", color: "var(--chart-5)", statuses: ["FAILED", "CREDIT_RECONCILIATION_REQUIRED"] },
  { key: "closed", label: "Hết hạn hoặc đã huỷ", color: "color-mix(in srgb, var(--muted-foreground) 55%, transparent)", statuses: ["EXPIRED", "CANCELLED"] },
];

/** The BE has no multi-status filter for orders, so these are queried one status at a time. */
export const WAITING_STATUS: OrderStatus = "ACTIVE";
