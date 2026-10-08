'use client';

import { useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button/Button';
import { Dialog, DialogBody, DialogContent } from '@/components/ui/dialog/Dialog';
import { DetailHeader, type DetailHeaderProps } from './DetailModalBadges';

export interface DetailFooterProps {
  createdAt?: string;
  updatedAt?: string;
  onClose: () => void;
  editLabel?: string;
  onEdit?: () => void;
}

function DetailFooter({ createdAt, updatedAt, onClose, editLabel, onEdit }: DetailFooterProps) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-page px-6 py-3">{createdAt || updatedAt ? <div className="space-x-4 text-xs tabular-nums text-muted-foreground">{createdAt ? <span>Tạo {createdAt}</span> : null}{updatedAt ? <span>Cập nhật {updatedAt}</span> : null}</div> : null}<div className="ml-auto flex gap-2"><Button type="button" variant="outline" onClick={onClose}>Đóng</Button>{onEdit && editLabel ? <Button type="button" variant="solid" onClick={onEdit}>{editLabel}</Button> : null}</div></div>;
}

export interface DetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  header: DetailHeaderProps;
  sections?: ReactNode;
  createdAt?: string;
  updatedAt?: string;
  onClose?: () => void;
  editLabel?: string;
  onEdit?: () => void;
}

export function DetailModal({ open, onOpenChange, size = 'md', header, sections, createdAt, updatedAt, onClose, editLabel, onEdit }: DetailModalProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const handleClose = () => { onClose?.(); onOpenChange(false); };
  // Focus the dialog itself so the header's copy tooltip is not opened on mount (it would swallow the first Escape).
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent ref={popupRef} initialFocus={popupRef} size={size} className="gap-0 p-0"><DetailHeader {...header} /><DialogBody className="space-y-3 px-6 py-4">{sections}</DialogBody><DetailFooter createdAt={createdAt} updatedAt={updatedAt} onClose={handleClose} editLabel={editLabel} onEdit={onEdit} /></DialogContent></Dialog>;
}

export type { DetailHeaderProps } from './DetailModalBadges';
export type { BadgeProps, InheritedHintProps, MonogramProps, StatusBadgeProps } from './DetailModalBadges';
export { Badge, InheritedHint, Monogram, StatusBadge } from './DetailModalBadges';
export type { DetailItemProps, DetailListProps, DetailSectionProps } from './DetailModalContent';
export { DetailItem, DetailList, DetailSection } from './DetailModalContent';
