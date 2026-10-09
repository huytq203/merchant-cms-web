import type { Withdrawal, WithdrawalBalance, WithdrawalStatus, WithdrawalStatusGroup } from "../schemas/withdrawal.schema";

export type { Withdrawal, WithdrawalBalance, WithdrawalStatus, WithdrawalStatusGroup };

export interface WithdrawalListFilter {
  page: number;
  pageSize: number;
  transactionCode?: string;
  /** A stage of the payout pipeline; BE filters by the statuses it holds. */
  statusGroup?: WithdrawalStatusGroup;
  /** Inclusive calendar days as `yyyy-MM-dd`. */
  createdFrom?: string;
  createdTo?: string;
}

/** The filters the user edits; page and page size are navigation state. */
export type WithdrawalFilterValues = Omit<WithdrawalListFilter, "page" | "pageSize">;

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
