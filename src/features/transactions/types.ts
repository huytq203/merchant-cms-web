export type TransactionStatus = 'success' | 'pending' | 'failed' | 'refunded';
export type CardType = 'visa' | 'mastercard' | 'napas' | 'amex';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'qr';

export interface Transaction {
  id: string;
  code: string;
  cardType: CardType;
  cardNumber: string;
  cardHolderName: string;
  amount: number;
  currency: string;
  fee: number;
  netAmount: number;
  subMerchantId: string;
  subMerchantName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  status: TransactionStatus;
  description: string;
  referenceCode: string;
  paymentMethod: PaymentMethod;
  bankCode: string;
  responseCode: string;
  responseMessage: string;
}

export interface TransactionListFilter {
  keyword?: string;
  customerContact?: string;
  status?: TransactionStatus | string;
  cardType?: CardType;
  paymentMethod?: string;
  subMerchantId?: string;
  bankCode?: string;
  createdFrom?: Date | null;
  createdTo?: Date | null;
  page?: number;
  pageSize?: number;
}

export interface TransactionListResponse {
  data: Transaction[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}
