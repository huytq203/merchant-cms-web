"server-only";
import type { Withdrawal } from "@prisma/client";

export interface WithdrawalResponse {
  id: string;
  code: string;
  subMerchantId: string;
  subMerchantName: string;
  subMerchantShort: string | null;
  amount: number;
  fee: number;
  bankName: string;
  bankAccount: string;
  accountName: string;
  status: string;
  requestedAt: string;
  createdAt: string;
  updatedAt: string | null;
}

export function toWithdrawalResponse(w: Withdrawal): WithdrawalResponse {
  return {
    id: w.id,
    code: w.code,
    subMerchantId: w.subMerchantId,
    subMerchantName: w.subMerchantName,
    subMerchantShort: w.subMerchantShort,
    amount: Number(w.amount),
    fee: w.fee,
    bankName: w.bankName,
    bankAccount: w.bankAccount,
    accountName: w.accountName,
    status: w.status,
    requestedAt: w.requestedAt.toISOString(),
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt?.toISOString() ?? null,
  };
}
