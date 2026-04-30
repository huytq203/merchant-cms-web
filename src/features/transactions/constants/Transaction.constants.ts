import type { BadgeProps } from '@/components/ui/badge/Badge';
import type { TransactionStatus, CardType } from '../types';

export const TRANSACTION_STATUS_OPTIONS: {
  value: TransactionStatus;
  label: string;
  variant: BadgeProps['variant'];
}[] = [
  { value: 'success',  label: 'Thành công', variant: 'soft-success' },
  { value: 'pending',  label: 'Đang xử lý', variant: 'soft-warning' },
  { value: 'failed',   label: 'Thất bại',   variant: 'soft-danger'  },
  { value: 'refunded', label: 'Hoàn tiền',  variant: 'soft-primary' },
];

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  visa:       'Visa',
  mastercard: 'Mastercard',
  napas:      'Napas',
  amex:       'Amex',
};
