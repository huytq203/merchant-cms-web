import { StatusBadge } from '@/components/page/StatusBadge';
import { TRANSACTION_STATUS_OPTIONS } from '../constants/Transaction.constants';
import type { TransactionStatus } from '../types';

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const option = TRANSACTION_STATUS_OPTIONS.find((item) => item.value === status);
  return <StatusBadge label={option?.label ?? status} tone={option?.tone ?? 'neutral'} />;
}
