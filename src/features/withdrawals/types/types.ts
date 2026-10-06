import type { Withdrawal, WithdrawalStatus } from "../schemas/withdrawal.schema";

export type { Withdrawal, WithdrawalStatus };

export interface WithdrawalListFilter {
  page: number;
  pageSize: number;
}

export interface WithdrawalListResult {
  rows: Withdrawal[];
  total: number;
}

/** Withdrawable accounts plus whether sub-merchant level accounts were left out because they cannot pay out yet. */
export interface WithdrawalBankOptions {
  options: WithdrawalBankOption[];
  hasHiddenSubMerchantAccounts: boolean;
}

/** A linked bank account the merchant may withdraw to; the number is already masked. */
export interface WithdrawalBankOption {
  id: string;
  bankCode: string;
  accountNumberMasked: string;
  accountName: string;
  isDefault: boolean;
  subMerchantId: string | null;
}
