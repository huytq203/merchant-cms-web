'use client';

import { Edit, Eye, Lock, QrCode, Unlock } from 'lucide-react';
import { RowActions } from '@/components/page/RowActions';
import type { SubMerchantRow } from '../types';
import { canLock, canUnlock } from '../utils/sub-merchant-mapper';

export type SubMerchantRowHandlers = {
  onViewDetail: (row: SubMerchantRow) => void;
  onEdit: (row: SubMerchantRow) => void;
  /** Left out for a session without LOCK_SUB_MERCHANT; the lock actions then disappear. */
  onLock?: (row: SubMerchantRow) => void;
  onUnlock?: (row: SubMerchantRow) => void;
  /** Mã QR tĩnh FlexPay cấp Sub (QR ví FlexPay 12/11/2026); bỏ khi session không có quyền xem Terminal. */
  onStaticQr?: (row: SubMerchantRow) => void;
};

export function SubMerchantRowActions({ item, ...handlers }: { item: SubMerchantRow } & SubMerchantRowHandlers) {
  const canEdit = canLock(item) || canUnlock(item);
  const lockAction = canLock(item)
    ? { label: 'Khóa', icon: <Lock size={16} />, visible: !!handlers.onLock, onClick: () => handlers.onLock?.(item) }
    : canUnlock(item)
      ? { label: 'Mở khóa', icon: <Unlock size={16} />, visible: !!handlers.onUnlock, onClick: () => handlers.onUnlock?.(item) }
      : {
        label: 'Mở khóa',
        icon: <Unlock size={16} />,
        visible: !!handlers.onUnlock && item.lockSource === 'CASCADE',
        disabled: true,
        disabledReason: item.lockSource === 'CASCADE' ? 'Không thể mở khóa vì Master đang khóa' : 'Không thể thay đổi trạng thái',
      };

  return (
    <RowActions
      subject={item.name}
      actions={[
        { label: 'Xem chi tiết', icon: <Eye size={16} />, onClick: () => handlers.onViewDetail(item) },
        { label: 'Sửa', icon: <Edit size={16} />, visible: canEdit, onClick: () => handlers.onEdit(item) },
        { label: 'QR tĩnh', icon: <QrCode size={16} />, visible: !!handlers.onStaticQr, onClick: () => handlers.onStaticQr?.(item) },
        lockAction,
      ]}
    />
  );
}
