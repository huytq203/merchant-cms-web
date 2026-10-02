import type { BadgeProps } from '@/components/ui/badge/Badge';
import type { ComplaintStatus, ComplaintSource } from '../types/types';

export const COMPLAINT_STATUS_OPTIONS: { value: ComplaintStatus; label: string; variant: BadgeProps['variant'] }[] = [
  { value: 'pending',    label: 'Chờ tiếp nhận', variant: 'soft-warning' },
  { value: 'processing', label: 'Đang xử lý',    variant: 'soft-primary' },
  { value: 'resolved',   label: 'Đã kết thúc',   variant: 'soft-success' },
  { value: 'rejected',   label: 'Từ chối',        variant: 'soft-danger'  },
];

export const COMPLAINT_SOURCE_OPTIONS: { value: ComplaintSource; label: string; variant: BadgeProps['variant'] }[] = [
  { value: 'customer', label: 'Khách hàng', variant: 'soft-primary' },
  { value: 'gateway',  label: 'Cổng',       variant: 'soft-warning' },
  { value: 'merchant', label: 'Merchant',   variant: 'secondary'   },
];
