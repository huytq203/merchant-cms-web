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
import { Button } from '@/components/ui';

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setIsRefundDialog: (open: boolean) => void;
  setIsReconciliationDialog: (open: boolean) => void;
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
  setIsRefundDialog,
  setIsReconciliationDialog,
}: TransactionDetailSheetProps) {
  const data = transaction;
  const statusOption = data
    ? TRANSACTION_STATUS_OPTIONS.find((o) => o.value === data.status)
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chi tiết giao dịch</SheetTitle>
        </SheetHeader>
        {data && (
          <SheetBody>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 items-start">
              {/* Thông tin cơ bản */}
              <SectionTitle>Thông tin cơ bản</SectionTitle>
              <DetailRow label="Mã giao dịch">
                <span className="font-mono text-primary">{data.code}</span>
              </DetailRow>
              <DetailRow label="Trạng thái">
                <Badge variant={statusOption?.variant ?? 'outline'} size="sm">
                  {statusOption?.label ?? data.status}
                </Badge>
              </DetailRow>
              <DetailRow label="Thời gian tạo">{formatDate(data.createdAt)}</DetailRow>
              <DetailRow label="Mô tả">{data.description}</DetailRow>

              {/* Thông tin thẻ */}
              <SectionTitle>Thông tin thẻ</SectionTitle>
              <DetailRow label="Loại thẻ">{CARD_TYPE_LABELS[data.cardType]}</DetailRow>
              <DetailRow label="Số thẻ">
                <span className="font-mono">{data.cardNumber}</span>
              </DetailRow>
              <DetailRow label="Chủ thẻ">{data.cardHolderName}</DetailRow>
              <DetailRow label="Ngân hàng">{data.bankCode}</DetailRow>

              {/* Thông tin thanh toán */}
              <SectionTitle>Thông tin thanh toán</SectionTitle>
              <DetailRow label="Số tiền">
                <span className="font-mono font-semibold text-foreground">
                  {formatAmount(data.amount)}
                </span>
              </DetailRow>
              <DetailRow label="Phí giao dịch">
                <span className="font-mono text-muted-foreground">
                  {formatAmount(data.fee)}
                </span>
              </DetailRow>
              <DetailRow label="Thực nhận">
                <span className="font-mono font-semibold text-emerald-600">
                  {formatAmount(data.netAmount)}
                </span>
              </DetailRow>

              {/* Sub-merchant */}
              <SectionTitle>Sub-merchant</SectionTitle>
              <DetailRow label="Tên Sub-merchant">{data.subMerchantName}</DetailRow>

              {/* Khách hàng */}
              <SectionTitle>Khách hàng</SectionTitle>
              <DetailRow label="Tên khách hàng">{data.customerName}</DetailRow>
              <DetailRow label="Số điện thoại">
                <span className="font-mono">{maskPhone(data.customerPhone)}</span>
              </DetailRow>

              {/* Kỹ thuật */}
              <SectionTitle>Thông tin kỹ thuật</SectionTitle>
              <DetailRow label="Mã tham chiếu">
                <span className="font-mono text-xs">{data.referenceCode}</span>
              </DetailRow>
              <DetailRow label="Mã phản hồi">
                <span className="font-mono">{data.responseCode}</span>
              </DetailRow>
              <DetailRow label="Thông báo">{data.responseMessage}</DetailRow>
            </dl>

           <div className="flex justify-start mt-3 w-full gap-2">
             <Button variant="outline" className='flex-1' onClick={() => setIsReconciliationDialog(true)}>
              Tra soát
            </Button>

            <Button className='flex-1' onClick={() => setIsRefundDialog(true)}>
              Hoàn tiền
            </Button>
           </div>
          </SheetBody>
        )}
      </SheetContent>
    </Sheet>
  );
}
