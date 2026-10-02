import type { BadgeProps } from '@/components/ui/badge/Badge';
import type { WithdrawalStatus } from '../types/types';

export const WITHDRAWAL_STATUS_OPTIONS: { value: WithdrawalStatus; label: string; variant: BadgeProps['variant'] }[] = [
  { value: 'pending',    label: 'Chờ xử lý',   variant: 'soft-warning' },
  { value: 'processing', label: 'Đang chuyển', variant: 'soft-primary' },
  { value: 'success',    label: 'Thành công',  variant: 'soft-success' },
  { value: 'failed',     label: 'Thất bại',    variant: 'soft-danger'  },
];
