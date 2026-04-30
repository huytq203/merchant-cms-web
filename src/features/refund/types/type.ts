export type RefundStatus = "pending" | "approved" | "rejected" | "success";

export interface Refund {
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
  status: RefundStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface RefundListResponse {
  data: Refund[];
  pagination: { total: number; page: number; pageSize: number };
}
