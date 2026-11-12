import { apiClient } from "@/lib/http/api-client";
import {
  customerDisplaySchema,
  customerDisplayStatusSchema,
  withKind,
  type CustomerDisplay,
  type CustomerDisplayStatus,
} from "./schemas";

/** Màn mở cho một đơn đang chờ, hoặc cho mã QR tĩnh của quầy. */
export type DisplaySource = { kind: "order" | "static-qr"; id: string };

/**
 * Gọi BFF qua `apiClient` để màn treo lâu ở quầy vẫn tự làm mới phiên khi access token hết hạn giữa chừng.
 * Không bật toast: màn khách không được hiện thông báo kỹ thuật, lỗi hiển thị ngay trong màn.
 */
export async function openDisplay(source: DisplaySource): Promise<CustomerDisplay> {
  const base = source.kind === "order" ? "/v1/admin/orders" : "/v1/admin/static-qrs";
  const body = await apiClient.post<unknown>(`${base}/${encodeURIComponent(source.id)}/customer-display`, undefined, { toast: false });
  return withKind(customerDisplaySchema.parse(body), source.kind === "order" ? "ORDER" : "STATIC_QR");
}

export async function fetchDisplayStatus(displayToken: string): Promise<CustomerDisplayStatus> {
  const body = await apiClient.get<unknown>(`/v1/admin/customer-display/${encodeURIComponent(displayToken)}/status`, { cache: "no-store" });
  return customerDisplayStatusSchema.parse(body);
}
