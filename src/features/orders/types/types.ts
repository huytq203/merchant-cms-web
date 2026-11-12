import type { Order, OrderStatus } from "../schemas/order.schema";

export type { Order, OrderStatus };

export interface OrderListFilter {
  page: number;
  pageSize: number;
  orderCode?: string;
  status?: OrderStatus;
  /** Subs the list is limited to (empty/absent = all Subs); BE intersects them with the session scope. */
  subMerchantIds?: string[];
  /** Inclusive calendar days as `yyyy-MM-dd`. */
  createdFrom?: string;
  createdTo?: string;
}

/** The filters the user edits; page and page size are navigation state. */
export type OrderFilterValues = Omit<OrderListFilter, "page" | "pageSize">;

export interface OrderListResult {
  rows: Order[];
  total: number;
}
