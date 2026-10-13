import type { BadgeProps } from '@/components/ui/badge/Badge';
import type { StatusTone } from '@/components/page/StatusBadge';
import type { ComplaintStatus, ComplaintSource } from '../types/types';

export const COMPLAINT_STATUS_OPTIONS: { value: ComplaintStatus; label: string; tone: StatusTone }[] = [
  { value: 'pending',    label: 'Chờ tiếp nhận', tone: 'warning' },
  { value: 'processing', label: 'Đang xử lý',    tone: 'info'    },
  { value: 'resolved',   label: 'Đã xử lý',      tone: 'success' },
  { value: 'rejected',   label: 'Từ chối',       tone: 'danger'  },
];

export const COMPLAINT_SOURCE_OPTIONS: { value: ComplaintSource; label: string; variant: BadgeProps['variant'] }[] = [
  { value: 'customer', label: 'Khách hàng', variant: 'soft-primary' },
  { value: 'gateway',  label: 'Cổng',       variant: 'soft-warning' },
  { value: 'merchant', label: 'Merchant',   variant: 'secondary'   },
];
