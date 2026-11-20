import type { BankAccountStatus } from "@/features/bank-accounts/types";
import type {
  PocketWithdrawalView,
  Withdrawal,
  WithdrawalBalance,
  WithdrawalPocket,
  WithdrawalStatus,
  WithdrawalStatusGroup,
} from "../schemas/withdrawal.schema";

export type { PocketWithdrawalView, Withdrawal, WithdrawalBalance, WithdrawalPocket, WithdrawalStatus, WithdrawalStatusGroup };

export interface WithdrawalListFilter {
  page: number;
  pageSize: number;
  transactionCode?: string;
  /** A stage of the payout pipeline; BE filters by the statuses it holds. */
  statusGroup?: WithdrawalStatusGroup;
  /** Subs the list is limited to (empty/absent = all Subs); BE intersects them with the session scope. */
  subMerchantIds?: string[];
  /** Inclusive calendar days as `yyyy-MM-dd`. */
  createdFrom?: string;
  createdTo?: string;
  /** Lọc theo nguồn tiền của lệnh (GĐ6); vắng = cả hai ngăn và lệnh cũ. */
  pocket?: WithdrawalPocket;
}

/** The filters the user edits; page and page size are navigation state. */
export type WithdrawalFilterValues = Omit<WithdrawalListFilter, "page" | "pageSize">;

export interface WithdrawalListResult {
  rows: Withdrawal[];
  total: number;
}

/** The account assigned to one Sub (SRS v2: exactly one per Sub); null = the Sub has no account yet. */
export interface WithdrawalReceivingAccountResult {
  account: WithdrawalReceivingAccount | null;
}

/** The account a Sub's withdrawal pays out to; the number is already masked by the BE. */
export interface WithdrawalReceivingAccount {
  id: string;
  bankCode: string;
  accountNumberMasked: string;
  accountName: string;
  /** Chờ xác minh still pays out; Khóa does not (BE refuses with 5738). */
  accountStatus: BankAccountStatus;
}
