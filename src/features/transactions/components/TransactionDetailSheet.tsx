'use client';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet/Sheet';
import { cn } from '@/lib/utils/cn';
import { BANK_OPTIONS, PAYMENT_METHOD_OPTIONS, optionLabel } from '../constants/Transaction.constants';
import { displayCode } from '../columns/TransactionColumn';
import { TransactionStatusBadge } from './TransactionStatusBadge';
import type { Transaction } from '../types';
import { Button } from '@/components/ui';
import { formatAmount, formatDate } from '@/lib/utils/helper';

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canRefund: boolean;
  canDispute: boolean;
  onRefund: () => void;
  onReconcile: () => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

/** "Code — Name", or a dash when the row has neither (an order without Sub or Terminal). */
const party = (code?: string | null, name?: string | null) => [code, name].filter(Boolean).join(' — ') || '—';

const money = (value?: number | null) => (value == null ? '—' : formatAmount(value));

function DetailRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn('break-words text-right text-sm font-medium text-foreground', className)}>{children}</dd>
    </div>
  );
}

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
  canRefund,
  canDispute,
  onRefund,
  onReconcile,
}: TransactionDetailSheetProps) {
  const data = transaction;
  const showRefund = canRefund && data?.status === 'SUCCESS';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chi tiết giao dịch</SheetTitle>
          {data && <p className="font-mono text-sm text-muted-foreground">{displayCode(data)}</p>}
        </SheetHeader>
        {data && (
          <>
            <SheetBody>
              <div className="grid gap-1.5 rounded-xl bg-muted p-4">
                <p className="font-mono text-2xl font-bold tabular-nums text-brand-ink">{formatAmount(data.amount)}</p>
                <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
                  <TransactionStatusBadge status={data.status} />
                  <span>{data.createdAt ? formatDate(data.createdAt) : '—'}</span>
                </div>
              </div>
              <dl>
                <SectionTitle>Thanh toán</SectionTitle>
                <DetailRow label="Số tiền"><span className="font-mono">{formatAmount(data.amount)}</span></DetailRow>
                <DetailRow label="Phí giao dịch"><span className="font-mono">{money(data.feeAmount)}</span></DetailRow>
                <DetailRow label="Bên chịu phí">{data.feeBearer === 'SENDER' ? 'Khách hàng' : 'Merchant'}</DetailRow>
                <DetailRow label="Khách phải trả"><span className="font-mono">{money(data.payableAmount)}</span></DetailRow>
                <DetailRow label="Thực nhận"><span className="font-mono text-success">{money(data.netAmount)}</span></DetailRow>
                <DetailRow label="Mã đơn hàng"><span className="font-mono">{data.orderCode}</span></DetailRow>

                <SectionTitle>Phương thức</SectionTitle>
                <DetailRow label="Hình thức">{optionLabel(PAYMENT_METHOD_OPTIONS, data.paymentMethod)}</DetailRow>
                <DetailRow label="Ngân hàng">{optionLabel(BANK_OPTIONS, data.bankCode)}</DetailRow>

                <SectionTitle>Nơi bán</SectionTitle>
                <DetailRow label="Merchant">{party(data.merchantCode, data.merchantName)}</DetailRow>
                <DetailRow label="Sub-merchant">{party(data.subMerchantCode, data.subMerchantName)}</DetailRow>
                <DetailRow label="Terminal">{party(data.terminalCode, data.terminalName)}</DetailRow>
                <DetailRow label="Cập nhật lần cuối">{data.updatedAt ? formatDate(data.updatedAt) : '—'}</DetailRow>
              </dl>
            </SheetBody>
            {(canDispute || showRefund) && (
              <SheetFooter>
                {canDispute && (
                  <Button variant="outline" className="flex-1" onClick={onReconcile}>
                    Tra soát
                  </Button>
                )}
                {showRefund && (
                  <Button className="flex-1" onClick={onRefund}>
                    Hoàn tiền
                  </Button>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
