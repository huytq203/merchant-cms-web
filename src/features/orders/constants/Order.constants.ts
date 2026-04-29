import type { BadgeProps } from '@/components/ui/badge/Badge';
import type { OrderStatus, OrderSource } from '../types';

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string; variant: BadgeProps['variant'] }[] = [
  { value: 'paid',      label: 'Đã thanh toán', variant: 'soft-success' },
  { value: 'pending',   label: 'Chờ thanh toán', variant: 'soft-warning' },
  { value: 'cancelled', label: 'Đã huỷ',         variant: 'soft-danger'  },
  { value: 'expired',   label: 'Hết hạn',         variant: 'secondary'   },
];

export const ORDER_SOURCE_OPTIONS: { value: OrderSource; label: string; variant: BadgeProps['variant'] }[] = [
  { value: 'api',          label: 'API',          variant: 'soft-primary' },
  { value: 'payment_link', label: 'Payment Link', variant: 'soft-success' },
];
