'use client';
import { Badge } from '@/components/ui/badge/Badge';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet/Sheet';
import { format } from 'date-fns';
import { SUB_MERCHANT_STATUS_OPTIONS } from '../constants/SubMerchant.constants';
import type { SubMerchant } from '../types';

interface SubMerchantDetailSheetProps {
  subMerchant: SubMerchant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm:ss');
  } catch {
    return dateStr;
  }
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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-sm text-muted-foreground self-center">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </>
  );
}

export function SubMerchantDetailSheet({
  subMerchant,
  open,
  onOpenChange,
}: SubMerchantDetailSheetProps) {
  if (!subMerchant) return null;

  const statusOption = SUB_MERCHANT_STATUS_OPTIONS.find(
    (o) => o.value === subMerchant.status,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chi tiết Sub-merchant</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 items-start">
            <SectionTitle>Thông tin cơ bản</SectionTitle>
            <DetailRow label="Mã Sub-merchant">
              <span className="font-mono text-primary">{subMerchant.id}</span>
            </DetailRow>
            <DetailRow label="Tên">
              {subMerchant.name}
            </DetailRow>
            <DetailRow label="Loại hình KD">
              {subMerchant.businessType}
            </DetailRow>
            <DetailRow label="Liên hệ">
              <span className="font-mono">{subMerchant.contact}</span>
            </DetailRow>
            <DetailRow label="Trạng thái">
              <Badge variant={statusOption?.variant ?? 'outline'} size="sm">
                {statusOption?.label ?? subMerchant.status}
              </Badge>
            </DetailRow>
            <DetailRow label="Ngày tạo">
              {formatDate(subMerchant.createdAt)}
            </DetailRow>
          </dl>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
