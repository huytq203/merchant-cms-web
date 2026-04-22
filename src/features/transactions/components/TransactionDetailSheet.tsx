'use client';
import { Badge } from '@/components/ui/badge/Badge';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet/Sheet';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';
import { CARD_TYPE_LABELS, TRANSACTION_STATUS_OPTIONS } from '../constants/Transaction.constants';
import type { Transaction } from '../types';

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' vnđ';
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm:ss');
  } catch {
    return dateStr;
  }
}

function maskPhone(phone: string) {
  if (phone.length <= 6) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-3);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-2 pt-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1.5 border-b border-border">
        {children}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <dt className="text-sm text-muted-foreground self-center">{label}</dt>
      <dd className={cn('text-sm font-medium text-foreground', className)}>
        {children}
      </dd>
    </>
  );
}

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailSheetProps) {
  if (!transaction) return null;

  const statusOption = TRANSACTION_STATUS_OPTIONS.find(
    (o) => o.value === transaction.status,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chi tiết giao dịch</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 items-start">
            {/* Thông tin cơ bản */}
            <SectionTitle>Thông tin cơ bản</SectionTitle>
            <DetailRow label="Mã giao dịch">
              <span className="font-mono text-primary">{transaction.code}</span>
            </DetailRow>
            <DetailRow label="Trạng thái">
              <Badge variant={statusOption?.variant ?? 'outline'} size="sm">
                {statusOption?.label ?? transaction.status}
              </Badge>
            </DetailRow>
            <DetailRow label="Thời gian tạo">
              {formatDate(transaction.createdAt)}
            </DetailRow>
            <DetailRow label="Mô tả">
              {transaction.description}
            </DetailRow>

            {/* Thông tin thẻ */}
            <SectionTitle>Thông tin thẻ</SectionTitle>
            <DetailRow label="Loại thẻ">
              {CARD_TYPE_LABELS[transaction.cardType]}
            </DetailRow>
            <DetailRow label="Số thẻ">
              <span className="font-mono">{transaction.cardNumber}</span>
            </DetailRow>
            <DetailRow label="Chủ thẻ">
              {transaction.cardHolderName}
            </DetailRow>
            <DetailRow label="Ngân hàng">
              {transaction.bankCode}
            </DetailRow>

            {/* Thông tin thanh toán */}
            <SectionTitle>Thông tin thanh toán</SectionTitle>
            <DetailRow label="Số tiền">
              <span className="font-mono font-semibold text-foreground">
                {formatAmount(transaction.amount)}
              </span>
            </DetailRow>
            <DetailRow label="Phí giao dịch">
              <span className="font-mono text-muted-foreground">
                {formatAmount(transaction.fee)}
              </span>
            </DetailRow>
            <DetailRow label="Thực nhận">
              <span className="font-mono font-semibold text-emerald-600">
                {formatAmount(transaction.netAmount)}
              </span>
            </DetailRow>

            {/* Sub-merchant */}
            <SectionTitle>Sub-merchant</SectionTitle>
            <DetailRow label="Tên Sub-merchant">
              {transaction.subMerchantName}
            </DetailRow>

            {/* Khách hàng */}
            <SectionTitle>Khách hàng</SectionTitle>
            <DetailRow label="Tên khách hàng">
              {transaction.customerName}
            </DetailRow>
            <DetailRow label="Số điện thoại">
              <span className="font-mono">{maskPhone(transaction.customerPhone)}</span>
            </DetailRow>

            {/* Kỹ thuật */}
            <SectionTitle>Thông tin kỹ thuật</SectionTitle>
            <DetailRow label="Mã tham chiếu">
              <span className="font-mono text-xs">{transaction.referenceCode}</span>
            </DetailRow>
            <DetailRow label="Mã phản hồi">
              <span className="font-mono">{transaction.responseCode}</span>
            </DetailRow>
            <DetailRow label="Thông báo">{transaction.responseMessage}</DetailRow>
          </dl>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
