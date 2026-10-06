'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTarget ? 'Sửa điểm bán' : 'Thêm điểm bán'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="mt-5 space-y-4" noValidate>
          <SubMerchantFormFields form={form} editTarget={editTarget} />
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="solid" isLoading={isSubmitting}>
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
