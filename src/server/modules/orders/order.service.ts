"server-only";
import { findAllOrders, type FindOrderParams } from "./order.repository";

export async function getOrderList(params: FindOrderParams) {
  return findAllOrders(params);
}
