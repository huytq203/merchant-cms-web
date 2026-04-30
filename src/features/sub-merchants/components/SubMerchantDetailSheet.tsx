'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge/Badge';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet/Sheet';
import { format } from 'date-fns';
import { Eye, EyeOff } from 'lucide-react';
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
      <dt className="text-sm text-muted-foreground self-start pt-0.5">{label}</dt>
      <dd className="text-sm font-medium text-foreground break-all">{children}</dd>
    </>
  );
}

function MaskedValue({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span className="flex items-center gap-1.5">
      <span className="font-mono text-xs">{revealed ? value : '••••••••••••••••'}</span>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label={revealed ? 'Ẩn' : 'Hiện'}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}

function CheckBadge({ value, label }: { value?: boolean; label: string }) {
  return (
    <Badge variant={value ? 'soft-success' : 'secondary'} size="sm">
      {label}
    </Badge>
  );
}

export function SubMerchantDetailSheet({
  subMerchant,
  open,
  onOpenChange,
}: SubMerchantDetailSheetProps) {
  const data = subMerchant;
  const statusOption = data
    ? SUB_MERCHANT_STATUS_OPTIONS.find((o) => o.value === data.status)
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg">
        <SheetHeader>
          <SheetTitle>Chi tiết Sub-merchant</SheetTitle>
        </SheetHeader>
        {data && (
          <SheetBody>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 items-start">
              {/* Thông tin cơ bản */}
              <SectionTitle>Thông tin cơ bản</SectionTitle>
              <DetailRow label="Mã SM">
                <span className="font-mono text-primary">{data.id}</span>
              </DetailRow>
              <DetailRow label="Tên">{data.name}</DetailRow>
              <DetailRow label="Loại hình KD">{data.businessType}</DetailRow>
              <DetailRow label="Liên hệ">
                <span className="font-mono">{data.contact}</span>
              </DetailRow>
              <DetailRow label="Trạng thái">
                <Badge variant={statusOption?.variant ?? 'outline'} size="sm">
                  {statusOption?.label ?? data.status}
                </Badge>
              </DetailRow>
              <DetailRow label="Ngày tạo">{formatDate(data.createdAt)}</DetailRow>

              {/* Thông tin pháp lý */}
              <SectionTitle>Thông tin pháp lý</SectionTitle>
              <DetailRow label="Mã số thuế">{data.taxCode || '—'}</DetailRow>
              <DetailRow label="Người đại diện">{data.representative || '—'}</DetailRow>
              <DetailRow label="Địa chỉ">
                <span className="col-span-2">{data.address || '—'}</span>
              </DetailRow>

              {/* Key kết nối */}
              <SectionTitle>Key kết nối</SectionTitle>
              <DetailRow label="Merchant ID">
                <span className="font-mono text-xs">{data.merchantId || '—'}</span>
              </DetailRow>
              <DetailRow label="Access Key">
                {data.accessKey ? <MaskedValue value={data.accessKey} /> : '—'}
              </DetailRow>
              <DetailRow label="Secret Key">
                {data.secretKey ? <MaskedValue value={data.secretKey} /> : '—'}
              </DetailRow>
              <DetailRow label="Webhook URL">
                <span className="font-mono text-xs break-all">{data.webhookUrl || '—'}</span>
              </DetailRow>

              {/* Tài khoản ngân hàng */}
              <SectionTitle>Tài khoản ngân hàng</SectionTitle>
              <DetailRow label="Ngân hàng">{data.bankName || '—'}</DetailRow>
              <DetailRow label="Chi nhánh">{data.bankBranch || '—'}</DetailRow>
              <DetailRow label="Số tài khoản">
                <span className="font-mono">{data.accountNumber || '—'}</span>
              </DetailRow>
              <DetailRow label="Chủ tài khoản">{data.accountName || '—'}</DetailRow>

              {/* Cấu hình thông báo */}
              <SectionTitle>Cấu hình thông báo</SectionTitle>
              <DetailRow label="Kích hoạt">
                <CheckBadge value={data.notifyEnabled} label={data.notifyEnabled ? 'Đang bật' : 'Tắt'} />
              </DetailRow>
              <DetailRow label="Loại thông báo">
                <div className="flex flex-wrap gap-1">
                  {data.notifyTxSuccess && <CheckBadge value label="GD thành công" />}
                  {data.notifyTxFailed && <CheckBadge value label="GD thất bại" />}
                  {data.notifyDispute && <CheckBadge value label="Khiếu nại" />}
                  {data.notifyFreeze && <CheckBadge value label="Đóng băng" />}
                  {data.notifyPolicyChange && <CheckBadge value label="Thay đổi CS" />}
                  {!data.notifyTxSuccess &&
                    !data.notifyTxFailed &&
                    !data.notifyDispute &&
                    !data.notifyFreeze &&
                    !data.notifyPolicyChange && (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                </div>
              </DetailRow>
              <DetailRow label="Email thông báo">
                <span className="font-mono text-xs">{data.notifyEmails || '—'}</span>
              </DetailRow>

              {/* Hóa đơn điện tử */}
              <SectionTitle>Hóa đơn điện tử</SectionTitle>
              <DetailRow label="Kích hoạt">
                <CheckBadge value={data.eInvoiceEnabled} label={data.eInvoiceEnabled ? 'Đang bật' : 'Tắt'} />
              </DetailRow>
              <DetailRow label="Email hóa đơn">
                <span className="font-mono text-xs">{data.eInvoiceEmails || '—'}</span>
              </DetailRow>
            </dl>
          </SheetBody>
        )}
      </SheetContent>
    </Sheet>
  );
}
