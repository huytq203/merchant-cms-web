"server-only";
import type { Order } from "@prisma/client";

export interface OrderResponse {
  id: string;
  code: string;
  source: string;
  subMerchantId: string;
  subMerchantName: string;
  createdBy: string | null;
  amount: number;
  transactionId: string | null;
  transactionCode: string | null;
  paymentUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export function toOrderResponse(order: Order): OrderResponse {
  return {
    id: order.id,
    code: order.code,
    source: order.source,
    subMerchantId: order.subMerchantId,
    subMerchantName: order.subMerchantName,
    createdBy: order.createdBy,
    amount: Number(order.amount),
    transactionId: order.transactionId,
    transactionCode: order.transactionCode,
    paymentUrl: order.paymentUrl,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt?.toISOString() ?? null,
  };
}
