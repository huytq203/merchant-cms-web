"use client";

import { Lock, Unlock } from "lucide-react";
import { Badge, DetailItem, DetailList, DetailModal, DetailSection } from "@/components/modal";
import { Button } from "@/components/ui/button/Button";
import type { TerminalDetail } from "../types";
import { canLockTerminal, canUnlockTerminal, terminalTypeLabel } from "../utils/terminal-mapper";
import { TerminalStatusBadge } from "./TerminalStatusBadge";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail?: TerminalDetail | null;
  error?: string;
  title?: string;
  onEdit?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
};

const empty = <span className="text-muted-foreground">Chưa có</span>;
const caption = "block text-xs font-normal text-muted-foreground";

const formatDateTime = (value?: string | null): string | undefined => (value ? new Date(value).toLocaleString("vi-VN") : undefined);
const initialsOf = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0)).join("") || "TT";

function LockAction({ detail, onLock, onUnlock }: Pick<Props, "onLock" | "onUnlock"> & { detail: TerminalDetail }) {
  if (canLockTerminal(detail) && onLock) {
    return <Button type="button" variant="outline" size="sm" leftIcon={<Lock className="h-4 w-4" aria-hidden="true" />} onClick={onLock}>Khóa Terminal</Button>;
  }
  if (canUnlockTerminal(detail) && onUnlock) {
    return <Button type="button" variant="outline" size="sm" leftIcon={<Unlock className="h-4 w-4" aria-hidden="true" />} onClick={onUnlock}>Mở khóa</Button>;
  }
  return null;
}

function TerminalFields({ detail, onLock, onUnlock }: Pick<Props, "onLock" | "onUnlock"> & { detail: TerminalDetail }) {
  const phone = detail.contactPhone;
  return (
    <>
      <div className="flex flex-wrap gap-2 empty:hidden">
        <LockAction detail={detail} onLock={onLock} onUnlock={onUnlock} />
      </div>
      <DetailSection title="Thông tin chung">
        <DetailList>
          <DetailItem label="Sub-merchant" wide>
            <span>
              {detail.subMerchantName ?? detail.subMerchantCode ?? empty}
              {detail.subMerchantName && detail.subMerchantCode ? <span className={`${caption} tabular-nums`}>{detail.subMerchantCode}</span> : null}
            </span>
          </DetailItem>
        </DetailList>
      </DetailSection>
      <DetailSection title="Liên hệ">
        <DetailList>
          <DetailItem label="Người liên hệ">{detail.contactPerson || empty}</DetailItem>
          <DetailItem label="Số điện thoại">
            {phone?.value ? (
              <span>
                <span className="tabular-nums">{phone.value}</span>
                {phone.inherited ? <span className={caption}>Dùng số của Sub-merchant</span> : null}
              </span>
            ) : empty}
          </DetailItem>
          {detail.address ? <DetailItem label="Địa chỉ" wide>{detail.address}</DetailItem> : null}
          {detail.note ? <DetailItem label="Ghi chú" wide>{detail.note}</DetailItem> : null}
        </DetailList>
      </DetailSection>
    </>
  );
}

export function TerminalDetailModal({ open, onOpenChange, detail, error, title = "Chi tiết Terminal", onEdit, onLock, onUnlock }: Props) {
  const header = detail
    ? {
        monogramInitials: initialsOf(detail.name),
        title: detail.name,
        code: detail.tid,
        statusBadge: <TerminalStatusBadge row={detail} />,
        secondaryBadge: <Badge tone="info">{terminalTypeLabel(detail.terminalType)}</Badge>,
      }
    : { monogramInitials: "TT", title };
  const sections = error
    ? <p role="alert" className="text-sm text-danger">{error}</p>
    : detail
      ? <TerminalFields detail={detail} onLock={onLock} onUnlock={onUnlock} />
      : <p role="status">Đang tải chi tiết...</p>;

  return (
    <DetailModal
      open={open}
      onOpenChange={onOpenChange}
      header={header}
      sections={sections}
      createdAt={formatDateTime(detail?.createdAt)}
      updatedAt={formatDateTime(detail?.updatedAt)}
      editLabel="Sửa"
      onEdit={detail ? onEdit : undefined}
    />
  );
}
