import type { Transaction } from "../types";

/** One row exactly as `GET /api/v1/merchant/transactions` returns it (order DH261102-2208 on dev). Test-only. */
export const BE_TRANSACTION: Transaction = {
  id: "7f65f7e7-3d1b-40ad-a047-d775acd45394",
  transactionCode: "FM26NEFQ9",
  orderCode: "DH261102-2208",
  merchantId: "eb8e7b15-5e65-4b71-b69e-2b8561f91f24",
  merchantCode: "MC000001",
  merchantName: "Halo tech",
  subMerchantId: "5dcda5e6-afd1-4201-a02f-7187164f0f86",
  subMerchantCode: "MC000001-S001",
  subMerchantName: "Halo Láng",
  terminalId: null,
  terminalCode: null,
  terminalName: null,
  paymentMethod: "QR",
  bankCode: "VCB",
  amount: 1500000,
  feeAmount: 30000,
  netAmount: 1470000,
  payableAmount: 1500000,
  feeBearer: "MERCHANT",
  currency: "VND",
  status: "SUCCESS",
  createdAt: "2026-11-02T14:09:29",
  updatedAt: "2026-11-02T14:17:54",
};
