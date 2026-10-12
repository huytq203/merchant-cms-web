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
import { CARD_TYPE_LABELS, PAYMENT_METHOD_OPTIONS, TRANSACTION_TYPE_OPTIONS } from '../constants/Transaction.constants';
import { TransactionStatusBadge } from './TransactionStatusBadge';
import type { Transaction } from '../types';
import { Button } from '@/components/ui';
import { formatAmount, formatDate, maskPhone } from '@/lib/utils/helper';

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
  const showRefund = canRefund && data?.status === 'success';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chi tiết giao dịch</SheetTitle>
          {data && <p className="font-mono text-sm text-muted-foreground">{data.code}</p>}
        </SheetHeader>
        {data && (
          <>
            <SheetBody>
              <div className="grid gap-1.5 rounded-xl bg-muted p-4">
                <p className="font-mono text-2xl font-bold tabular-nums text-brand-ink">{formatAmount(data.amount)}</p>
                <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
                  <TransactionStatusBadge status={data.status} />
                  <span>{formatDate(data.createdAt)}</span>
                </div>
              </div>
              <dl>
                <SectionTitle>Thanh toán</SectionTitle>
                <DetailRow label="Số tiền"><span className="font-mono">{formatAmount(data.amount)}</span></DetailRow>
                <DetailRow label="Phí giao dịch"><span className="font-mono">{formatAmount(data.fee)}</span></DetailRow>
                <DetailRow label="Thực nhận"><span className="font-mono text-success">{formatAmount(data.netAmount)}</span></DetailRow>
                <DetailRow label="Loại giao dịch">{TRANSACTION_TYPE_OPTIONS.find((option) => option.value === data.type)?.label ?? data.type}</DetailRow>
                <DetailRow label="Mã hóa đơn"><span className="font-mono">{data.invoiceCode ?? '—'}</span></DetailRow>
                <DetailRow label="Mô tả">{data.description}</DetailRow>

                <SectionTitle>Phương thức</SectionTitle>
                <DetailRow label="Hình thức">{PAYMENT_METHOD_OPTIONS.find((option) => option.value === data.paymentMethod)?.label ?? data.paymentMethod}</DetailRow>
                <DetailRow label="Loại thẻ">{CARD_TYPE_LABELS[data.cardType]}</DetailRow>
                <DetailRow label="Số thẻ"><span className="font-mono">{data.cardNumber}</span></DetailRow>
                <DetailRow label="Chủ thẻ">{data.cardHolderName}</DetailRow>
                <DetailRow label="Ngân hàng">{data.bankCode}</DetailRow>

                <SectionTitle>Khách hàng và nơi bán</SectionTitle>
                <DetailRow label="Khách hàng">{data.customerName}</DetailRow>
                <DetailRow label="Số điện thoại"><span className="font-mono">{maskPhone(data.customerPhone)}</span></DetailRow>
                <DetailRow label="Sub-merchant">{data.subMerchantName}</DetailRow>

                <SectionTitle>Kỹ thuật</SectionTitle>
                <DetailRow label="Mã tham chiếu"><span className="font-mono text-xs">{data.referenceCode}</span></DetailRow>
                <DetailRow label="Mã phản hồi"><span className="font-mono">{data.responseCode}</span></DetailRow>
                <DetailRow label="Thông báo">{data.responseMessage}</DetailRow>
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
