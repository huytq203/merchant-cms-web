'use client';

import { useQuery } from '@tanstack/react-query';
import { useBusinessCategoryOptions } from '@/features/business-categories/hooks/use-business-category-options';
import { kybQueries } from '@/features/kyb/kyb-queries';
import type { SubMerchantDialogs as Dialogs } from '../hooks/use-sub-merchant-dialogs';
import type { useSubMerchantActions } from '../hooks/use-sub-merchant-actions';
import { DetailDeepLink } from '@/components/modal';
import { useDetailParam } from '@/hooks/use-detail-param';
import { subMerchantQueries } from '../sub-merchant-queries';
import { canLock, canUnlock } from '../utils/sub-merchant-mapper';
import { DialogActive } from './DialogActive';
import { DialogUnActive } from './DialogUnActive';
import { SubMerchantDetailModal } from './SubMerchantDetailModal';
import { SubMerchantFormModal } from './SubMerchantFormModal';

type Props = {
  dialogs: Dialogs;
  actions: ReturnType<typeof useSubMerchantActions>;
  canLock: boolean;
  /** Master của Sub mới; thiếu thì form không biết trước chính sách hợp đồng/ngành mặc định. */
  merchantId?: string;
};

export function SubMerchantDialogs({ dialogs, actions, canLock: mayLock, merchantId }: Props) {
  const { activeDialog, target } = dialogs;
  const { closeDetail } = useDetailParam();
  const needsDetail = activeDialog === 'detail' || activeDialog === 'edit';
  const detail = useQuery({
    ...subMerchantQueries.detail(target?.id ?? ''),
    enabled: Boolean(target) && needsDetail,
  });
  const formOpen = activeDialog === 'create' || activeDialog === 'edit';
  const categories = useBusinessCategoryOptions(detail.data?.mccCode, formOpen);
  // Hồ sơ Master cho biết ngành mặc định và việc Master có ký hợp đồng riêng với từng Sub không. Chỉ cần khi thêm mới;
  // lỗi tải thì form vẫn dùng được (ô hợp đồng tùy chọn) và BE chặn bằng mã 5205.
  const master = useQuery({ ...kybQueries.profile(merchantId ?? ''), enabled: activeDialog === 'create' && Boolean(merchantId) });
  const closeOnDismiss = (open: boolean) => {
    if (open) return;
    actions.closeDialog();
    closeDetail();
  };

  return (
    <>
      <SubMerchantDetailModal
        open={activeDialog === 'detail'}
        onOpenChange={closeOnDismiss}
        detail={detail.data ?? null}
        onRefreshLinks={() => void detail.refetch()}
        onEdit={target && (canLock(target) || canUnlock(target)) ? () => dialogs.openFor('edit', target) : undefined}
        onLock={mayLock && target ? () => dialogs.openFor('lock', target) : undefined}
        onUnlock={mayLock && target ? () => dialogs.openFor('unlock', target) : undefined}
      />
      <SubMerchantFormModal
        open={formOpen}
        onOpenChange={closeOnDismiss}
        editTarget={activeDialog === 'edit' ? detail.data : null}
        onSubmit={actions.saveForm}
        isSubmitting={actions.isSaving}
        error={actions.saveError}
        categories={categories.options}
        categoriesLoading={categories.isLoading}
        defaultMccCode={master.data?.mccCode}
        contractRequired={master.data?.contractSignedWithSub === true}
        onRefreshLinks={() => void detail.refetch()}
      />
      {/* `?detail=<id>` từ thông báo/push: tải Sub-merchant rồi mở hộp chi tiết ở trên. */}
      <DetailDeepLink query={subMerchantQueries.detail} onLoaded={(sub) => dialogs.openFor('detail', sub)} />
      <DialogActive
        open={activeDialog === 'lock'}
        onOpenChange={closeOnDismiss}
        target={target}
        onConfirm={actions.confirmLock}
        isLoading={actions.isLocking}
        error={actions.lockError}
      />
      <DialogUnActive
        open={activeDialog === 'unlock'}
        onOpenChange={closeOnDismiss}
        target={target}
        onConfirm={actions.confirmUnlock}
        isLoading={actions.isUnlocking}
        error={actions.unlockError}
      />
    </>
  );
}
