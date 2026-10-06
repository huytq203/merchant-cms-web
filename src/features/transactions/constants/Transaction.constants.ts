import type { BadgeProps } from '@/components/ui/badge/Badge';
import type { TransactionStatus, TransactionType, CardType, PaymentMethod } from '../types';

export const TRANSACTION_STATUS_OPTIONS: {
  value: TransactionStatus;
  label: string;
  variant: BadgeProps['variant'];
}[] = [
  { value: 'success',  label: 'Thành công', variant: 'soft-success' },
  { value: 'pending',  label: 'Đang xử lý', variant: 'soft-warning' },
  { value: 'failed',   label: 'Thất bại',   variant: 'soft-danger'  },
  { value: 'refunded', label: 'Hoàn tiền',  variant: 'soft-primary' },
  { value: 'review', label: 'Chờ duyệt', variant: 'soft-warning' },
  { value: 'cancelled', label: 'Đã hủy', variant: 'soft-danger' },
  { value: 'created', label: 'Mới tạo', variant: 'soft-primary' },
  { value: 'expired', label: 'Hết hạn', variant: 'outline' },
];

export const TRANSACTION_TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'payment', label: 'Thanh toán (thu hộ)' },
  { value: 'refund', label: 'Hoàn tiền' },
  { value: 'top_up', label: 'Nạp ví' },
  { value: 'withdrawal', label: 'Rút ví' },
  { value: 'payout', label: 'Chi hộ' },
  { value: 'settlement', label: 'Quyết toán' },
];

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  visa:       'Visa',
  mastercard: 'Mastercard',
  napas:      'Napas',
  amex:       'Amex',
};

export const PAYMENT_METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: 'Thẻ tín dụng', value: 'credit_card' },
  { label: 'Thẻ ghi nợ',   value: 'debit_card'  },
  { label: 'QR Code',      value: 'qr'          },
];

export const BANK_OPTIONS = [
  { label: 'Vietcombank (VCB)', value: 'VCB'  },
  { label: 'Techcombank (TCB)', value: 'TCB'  },
  { label: 'MB Bank (MB)',      value: 'MB'   },
  { label: 'BIDV',              value: 'BIDV' },
  { label: 'ACB',               value: 'ACB'  },
  { label: 'TPBank (TPB)',      value: 'TPB'  },
  { label: 'VIB',               value: 'VIB'  },
  { label: 'Agribank (AGRI)',   value: 'AGRI' },
];
