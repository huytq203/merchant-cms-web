'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormModal } from '@/components/modal/FormModal';
import type { BusinessCategoryOption } from '@/features/business-categories/utils';
import { subMerchantFormSchema, type SubMerchantFormValues } from '../schemas';
import type { SubMerchantDetail } from '../types';
import {
  defaultFormValues,
  toFormValues,
  toSubmitValues,
  type SubMerchantSubmitValues,
} from '../utils/sub-merchant-form-values';
import { SubMerchantFormFields } from './SubMerchantFormFields';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget?: SubMerchantDetail | null;
  onSubmit: (values: SubMerchantSubmitValues) => void | Promise<void>;
  isSubmitting?: boolean;
  error?: string;
  /** Danh mục ngành nghề cho dropdown. */
  categories?: BusinessCategoryOption[];
  categoriesLoading?: boolean;
  /** Mã MCC của Master, điền sẵn khi thêm mới (người dùng vẫn đổi được). */
  defaultMccCode?: string | null;
  /** Master ký hợp đồng riêng với từng Sub: thêm Sub mà thiếu hợp đồng bị chặn ngay tại form. */
  contractRequired?: boolean;
  /** Tải lại chi tiết khi liên kết xem hợp đồng hết hạn. */
  onRefreshLinks?: () => void;
};

const CONTRACT_REQUIRED_MESSAGE = 'Master ký hợp đồng riêng với từng Sub-merchant, vui lòng đính kèm hợp đồng của Sub-merchant';

export function SubMerchantFormModal({
  open,
  onOpenChange,
  editTarget,
  onSubmit,
  isSubmitting,
  error,
  categories,
  categoriesLoading,
  defaultMccCode,
  contractRequired = false,
  onRefreshLinks,
}: Props) {
  const form = useForm<SubMerchantFormValues>({
    resolver: zodResolver(subMerchantFormSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });
  useEffect(() => {
    if (open) form.reset(toFormValues(editTarget));
  }, [open, editTarget, form]);
  // Hồ sơ Master thường về sau khi form đã mở: chỉ điền ngành mặc định nếu người dùng chưa chọn gì.
  useEffect(() => {
    if (!open || editTarget || !defaultMccCode) return;
    if (!form.getValues('mccCode') && !form.formState.dirtyFields.mccCode) {
      form.setValue('mccCode', defaultMccCode);
    }
  }, [open, editTarget, defaultMccCode, form]);
  const submit = (values: SubMerchantFormValues) => {
    // Chặn sớm cho đỡ một vòng gọi BE; BE vẫn kiểm lại (mã 5205).
    if (!editTarget && contractRequired && !values.contractStagingId) {
      form.setError('contractStagingId', { type: 'required', message: CONTRACT_REQUIRED_MESSAGE });
      return;
    }
    return onSubmit(toSubmitValues(values));
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={editTarget ? 'Sửa Sub-merchant' : 'Thêm Sub-merchant'}
      description={editTarget ? editTarget.code : 'Sub-merchant mới thuộc Master của bạn.'}
      submitLabel={editTarget ? 'Lưu thay đổi' : 'Thêm Sub-merchant'}
      isSubmitting={isSubmitting}
      error={error}
      onSubmit={() => void form.handleSubmit(submit)()}
    >
      <SubMerchantFormFields
        form={form}
        editTarget={editTarget}
        categories={categories}
        categoriesLoading={categoriesLoading}
        contractRequired={contractRequired}
        onRefreshLinks={onRefreshLinks}
      />
    </FormModal>
  );
}
