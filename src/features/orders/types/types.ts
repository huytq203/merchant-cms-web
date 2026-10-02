export type OrderStatus = 'paid' | 'pending' | 'cancelled' | 'expired';
export type OrderSource = 'api' | 'payment_link';

export interface Order {
  id: string;
  code: string;
  source: OrderSource;
  subMerchantId: string;
  subMerchantName: string;
  createdBy: string | null;
  amount: number;
  transactionId: string | null;
  transactionCode: string | null;
  paymentUrl: string | null;
  status: OrderStatus;
  createdAt: string|null;
  updatedAt: string | null;
}

export interface OrderListResponse {
  data: Order[];
  pagination: { total: number; page: number; pageSize: number };
}

export type OrderListFilter = {
  createdFromDate?: string|undefined;
  createdToDate?: string|undefined;
  source?: string;
  createdBy?: string;
  status?: string;
};
