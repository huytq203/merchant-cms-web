import type { StatusTone } from '@/components/page/StatusBadge';
import {
  BANK_OPTIONS as ORDER_BANK_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS as ORDER_PAYMENT_METHOD_OPTIONS,
} from '@/features/orders/constants/Order.constants';
import type { TransactionStatus } from '../types';

/** Tone of each order status on this screen; labels are the order screen's so both read the same. */
const STATUS_TONES: Record<TransactionStatus, StatusTone> = {
  PENDING: 'neutral',
  ACTIVE: 'warning',
  PAYMENT_CONFIRMED: 'info',
  CREDIT_PENDING: 'info',
  CREDIT_POSTING: 'info',
  CREDIT_RECONCILIATION_REQUIRED: 'danger',
  SUCCESS: 'success',
  FAILED: 'danger',
  EXPIRED: 'neutral',
  CANCELLED: 'danger',
};

export const TRANSACTION_STATUS_OPTIONS: { value: TransactionStatus; label: string; tone: StatusTone }[] =
  ORDER_STATUS_OPTIONS.map(({ value, label }) => ({ value, label, tone: STATUS_TONES[value] }));

export const PAYMENT_METHOD_OPTIONS = ORDER_PAYMENT_METHOD_OPTIONS;

export const BANK_OPTIONS = ORDER_BANK_OPTIONS;

export function optionLabel(options: { value: string; label: string }[], value: string | null | undefined): string {
  return options.find((option) => option.value === value)?.label ?? value ?? '—';
}
