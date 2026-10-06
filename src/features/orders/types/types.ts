import type { Order, OrderStatus } from "../schemas/order.schema";

export type { Order, OrderStatus };

export interface OrderListFilter {
  page: number;
  pageSize: number;
  orderCode?: string;
  status?: OrderStatus;
}

export interface OrderListResult {
  rows: Order[];
  total: number;
}
