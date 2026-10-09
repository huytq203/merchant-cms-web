import { useQuery } from "@tanstack/react-query";
import { orderQueries } from "../order-queries";
import type { Order } from "../types/types";

/**
 * An unpaid order that already uses this code. BE answers a repeated code by updating that order and
 * issuing a new QR, so the form warns before the merchant overwrites it by accident.
 */
export function useDuplicateOrder(orderCode: string): Order | undefined {
  const code = orderCode.trim();
  const query = useQuery({
    ...orderQueries.list({ page: 1, pageSize: 10, orderCode: code }),
    enabled: code.length > 0,
    select: (data) => data.rows.find((row) => row.status === "ACTIVE" && row.orderCode.toLowerCase() === code.toLowerCase()),
  });
  return query.data;
}
