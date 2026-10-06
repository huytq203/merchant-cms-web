'use client';

import { Edit, Eye, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip/Tooltip';
import type { SubMerchantRow } from '../types';
import { canLock, canUnlock } from '../utils/sub-merchant-mapper';

export type SubMerchantRowHandlers = {
  onViewDetail: (row: SubMerchantRow) => void;
  onEdit: (row: SubMerchantRow) => void;
  onLock: (row: SubMerchantRow) => void;
  onUnlock: (row: SubMerchantRow) => void;
};

type IconActionProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

function IconAction({ label, onClick, disabled, children }: IconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Spacer() {
  return <span className="inline-block w-8" />;
}

function LockAction({ item, onLock, onUnlock }: { item: SubMerchantRow } & Pick<SubMerchantRowHandlers, 'onLock' | 'onUnlock'>) {
  if (canLock(item)) {
    return (
      <IconAction label={`Khóa ${item.name}`} onClick={() => onLock(item)}>
        <Lock size={16} />
      </IconAction>
    );
  }
  if (canUnlock(item)) {
    return (
      <IconAction label={`Mở khóa ${item.name}`} onClick={() => onUnlock(item)}>
        <Unlock size={16} />
      </IconAction>
    );
  }
  if (item.status === 'INACTIVE' && item.lockSource === 'CASCADE') {
    return (
      <IconAction label={`Không thể mở khóa vì Master đang khóa: ${item.name}`} disabled>
        <Unlock size={16} />
      </IconAction>
    );
  }
  return <Spacer />;
}

export function SubMerchantRowActions({ item, ...handlers }: { item: SubMerchantRow } & SubMerchantRowHandlers) {
  const canEdit = canLock(item) || canUnlock(item);
  return (
    <div className="flex items-center gap-1">
      <IconAction label={`Xem chi tiết ${item.name}`} onClick={() => handlers.onViewDetail(item)}>
        <Eye size={16} />
      </IconAction>
      {canEdit ? (
        <IconAction label={`Sửa ${item.name}`} onClick={() => handlers.onEdit(item)}>
          <Edit size={16} />
        </IconAction>
      ) : (
        <Spacer />
      )}
      <LockAction item={item} onLock={handlers.onLock} onUnlock={handlers.onUnlock} />
    </div>
  );
}
