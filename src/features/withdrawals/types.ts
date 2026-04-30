export type WithdrawalStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface Withdrawal {
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
  status: WithdrawalStatus;
  requestedAt: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface WithdrawalListResponse {
  data: Withdrawal[];
  pagination: { total: number; page: number; pageSize: number };
}
