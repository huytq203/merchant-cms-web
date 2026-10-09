'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormModal } from '@/components/modal/FormModal';
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
};

export function SubMerchantFormModal({
  open,
  onOpenChange,
  editTarget,
  onSubmit,
  isSubmitting,
  error,
}: Props) {
  const form = useForm<SubMerchantFormValues>({
    resolver: zodResolver(subMerchantFormSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });
  useEffect(() => {
    if (open) form.reset(toFormValues(editTarget));
  }, [open, editTarget, form]);
  const submit = (values: SubMerchantFormValues) => onSubmit(toSubmitValues(values));

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
      <SubMerchantFormFields form={form} editTarget={editTarget} />
    </FormModal>
  );
}
