import type { BadgeProps } from "@/components/ui/badge/Badge";
import type { OrderStatus } from "../schemas/order.schema";

type StatusOption = { value: OrderStatus; label: string; variant: BadgeProps["variant"] };

export const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: "PENDING", label: "Mới tạo", variant: "secondary" },
  { value: "ACTIVE", label: "Chờ thanh toán", variant: "soft-warning" },
  { value: "PAYMENT_CONFIRMED", label: "Đã xác nhận thanh toán", variant: "soft-primary" },
  { value: "CREDIT_PENDING", label: "Chờ ghi có", variant: "soft-primary" },
  { value: "CREDIT_POSTING", label: "Đang ghi có", variant: "soft-primary" },
  { value: "CREDIT_RECONCILIATION_REQUIRED", label: "Cần đối soát", variant: "soft-danger" },
  { value: "SUCCESS", label: "Thành công", variant: "soft-success" },
  { value: "FAILED", label: "Thất bại", variant: "soft-danger" },
  { value: "EXPIRED", label: "Hết hạn", variant: "secondary" },
  { value: "CANCELLED", label: "Đã huỷ", variant: "soft-danger" },
];

export const BANK_OPTIONS = [
  { value: "VCB", label: "Vietcombank" },
  { value: "VPB", label: "VPBank" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "QR", label: "QR Code" },
  { value: "DOMESTIC_CARD", label: "Thẻ nội địa" },
  { value: "INTERNATIONAL_CARD", label: "Thẻ quốc tế" },
  { value: "LINKED_WALLET", label: "Ví liên kết" },
  { value: "VIRTUAL_ACCOUNT", label: "Tài khoản định danh" },
];

export const EXPIRY_OPTIONS = [
  { value: "0", label: "Không hết hạn" },
  { value: "60", label: "1 giờ" },
  { value: "720", label: "12 giờ" },
  { value: "1440", label: "24 giờ" },
];

export function labelOf(options: { value: string; label: string }[], value: string | null | undefined): string {
  return options.find((option) => option.value === value)?.label ?? "—";
}
