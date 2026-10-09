'use client';

import type { ReactNode } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Badge as TagBadge, DetailItem, DetailList, DetailModal, DetailSection } from '@/components/modal/DetailModal';
import { Badge } from '@/components/ui/badge/Badge';
import { Button } from '@/components/ui/button/Button';
import { statusBadge } from '../columns/SubMerchantColumn';
import type { SubMerchantDetail } from '../types';
import { canLock, canUnlock } from '../utils/sub-merchant-mapper';

type Props = {
  detail: SubMerchantDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omitted when the outlet cannot be edited, such as a closed one; the Sửa button then disappears. */
  onEdit?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
};

const empty = <span className="text-muted-foreground">Chưa có</span>;

function formatDateTime(value: string | null | undefined): string | undefined {
  return value ? new Date(value).toLocaleString('vi-VN') : undefined;
}

function Contact({ field }: { field: SubMerchantDetail['phone'] }) {
  if (!field.value) return empty;
  return (
    <span className="flex flex-col">
      <span>{field.value}</span>
      {field.suspended ? <Badge variant="soft-warning">Tạm dừng</Badge> : null}
      {!field.suspended && field.inherited ? <span className="text-xs font-normal text-muted-foreground">Kế thừa từ Master</span> : null}
    </span>
  );
}

function LockAction({ detail, onLock, onUnlock }: Pick<Props, 'onLock' | 'onUnlock'> & { detail: SubMerchantDetail }) {
  if (canLock(detail) && onLock) {
    return <Button type="button" variant="outline" size="sm" leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />} onClick={onLock}>Khóa Sub-merchant</Button>;
  }
  if (canUnlock(detail) && onUnlock) {
    return <Button type="button" variant="outline" size="sm" leftIcon={<Unlock className="h-4 w-4" aria-hidden="true" />} onClick={onUnlock}>Mở khóa</Button>;
  }
  return null;
}

function Sections({ detail, onLock, onUnlock }: Pick<Props, 'onLock' | 'onUnlock'> & { detail: SubMerchantDetail }): ReactNode {
  return (
    <>
      <div className="flex flex-wrap gap-2 empty:hidden">
        <LockAction detail={detail} onLock={onLock} onUnlock={onUnlock} />
      </div>
      <DetailSection title="Thông tin chung">
        <DetailList>
          <DetailItem label="Lĩnh vực kinh doanh" wide>{detail.businessField || empty}</DetailItem>
        </DetailList>
      </DetailSection>
      <DetailSection title="Thông tin pháp lý" aside="Lấy từ Master">
        <DetailList>
          <DetailItem label="Mã số thuế"><span className="tabular-nums">{detail.taxCode || empty}</span></DetailItem>
          <DetailItem label="Tên pháp lý">{detail.legalName || empty}</DetailItem>
          <DetailItem label="Người đại diện pháp luật" wide>{detail.legalRepresentativeName || empty}</DetailItem>
        </DetailList>
      </DetailSection>
      <DetailSection title="Liên hệ">
        <DetailList>
          <DetailItem label="Số điện thoại"><Contact field={detail.phone} /></DetailItem>
          <DetailItem label="Địa chỉ"><Contact field={detail.address} /></DetailItem>
        </DetailList>
      </DetailSection>
    </>
  );
}

const initialsOf = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0)).join('') || '?';

export function SubMerchantDetailModal({ detail, open, onOpenChange, onEdit, onLock, onUnlock }: Props) {
  if (!detail) return null;

  return (
    <DetailModal
      open={open}
      onOpenChange={onOpenChange}
      header={{
        monogramInitials: initialsOf(detail.name),
        title: detail.name,
        code: detail.code,
        statusBadge: statusBadge(detail),
        secondaryBadge: detail.isDefault ? <TagBadge tone="info">Mặc định</TagBadge> : undefined,
      }}
      sections={<Sections detail={detail} onLock={onLock} onUnlock={onUnlock} />}
      createdAt={formatDateTime(detail.createdAt)}
      updatedAt={formatDateTime(detail.updatedAt)}
      editLabel="Sửa"
      onEdit={onEdit}
    />
  );
}
