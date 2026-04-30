"server-only";
import type { Refund } from "@prisma/client";

export interface RefundResponse {
  id: string;
  code: string;
  transactionId: string;
  transactionCode: string;
  invoiceCode: string | null;
  subMerchantId: string;
  subMerchantName: string;
  requestAmount: number;
  actualAmount: number;
  feeMb: number;
  feeNm: number;
  recipientName: string;
  recipientCard: string | null;
  createdBy: string | null;
  reason: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export function toRefundResponse(refund: Refund): RefundResponse {
  return {
    id: refund.id,
    code: refund.code,
    transactionId: refund.transactionId,
    transactionCode: refund.transactionCode,
    invoiceCode: refund.invoiceCode,
    subMerchantId: refund.subMerchantId,
    subMerchantName: refund.subMerchantName,
    requestAmount: Number(refund.requestAmount),
    actualAmount: Number(refund.actualAmount),
    feeMb: refund.feeMb,
    feeNm: refund.feeNm,
    recipientName: refund.recipientName,
    recipientCard: refund.recipientCard,
    createdBy: refund.createdBy,
    reason: refund.reason,
    status: refund.status,
    createdAt: refund.createdAt.toISOString(),
    updatedAt: refund.updatedAt?.toISOString() ?? null,
  };
}
