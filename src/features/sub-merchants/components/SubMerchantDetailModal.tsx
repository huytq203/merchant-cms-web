'use client';

import { Badge } from '@/components/ui/badge/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { statusBadge } from '../columns/SubMerchantColumn';
import type { SubMerchantDetail } from '../types';

type Props = {
  detail: SubMerchantDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium">{children || '—'}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="col-span-2 border-t pt-3 font-semibold">{children}</div>;
}

function Inherited({ field }: { field: SubMerchantDetail['phone'] }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      {field.value || '—'}
      {field.suspended ? <Badge variant="soft-warning">Tạm dừng</Badge> : null}
      {!field.suspended && field.inherited ? (
        <Badge variant="secondary">Kế thừa từ Master</Badge>
      ) : null}
    </span>
  );
}

function formatDateTime(value: string | null | undefined): string | null {
  return value ? new Date(value).toLocaleString('vi-VN') : null;
}

function DetailBody({ detail }: { detail: SubMerchantDetail }) {
  return (
    <dl className="mt-5 grid grid-cols-2 gap-4">
      <Field label="Mã">{detail.code}</Field>
      <Field label="Tên">{detail.name}</Field>
      <Field label="Trạng thái">{statusBadge(detail)}</Field>
      <Field label="Mặc định">{detail.isDefault ? 'Mặc định' : 'Không'}</Field>
      <Field label="Lĩnh vực kinh doanh">{detail.businessField}</Field>
      <SectionTitle>Thông tin pháp lý</SectionTitle>
      <Field label="Mã số thuế">{detail.taxCode}</Field>
      <Field label="Tên pháp lý">{detail.legalName}</Field>
      <Field label="Người đại diện pháp luật">{detail.legalRepresentativeName}</Field>
      <SectionTitle>Liên hệ</SectionTitle>
      <Field label="Số điện thoại"><Inherited field={detail.phone} /></Field>
      <Field label="Địa chỉ"><Inherited field={detail.address} /></Field>
      <Field label="Ngày tạo">{formatDateTime(detail.createdAt)}</Field>
      <Field label="Ngày cập nhật">{formatDateTime(detail.updatedAt)}</Field>
    </dl>
  );
}

export function SubMerchantDetailModal({ detail, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{detail?.name ?? 'Chi tiết điểm bán'}</DialogTitle>
        </DialogHeader>
        {detail ? <DetailBody detail={detail} /> : null}
      </DialogContent>
    </Dialog>
  );
}
