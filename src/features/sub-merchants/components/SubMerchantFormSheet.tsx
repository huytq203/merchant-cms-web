'use client';
import { Button, ComboBox, Form, FormField, Input } from '@/components/ui';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet/Sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BUSINESS_TYPE_OPTIONS, SUB_MERCHANT_STATUS_OPTIONS } from '../constants/SubMerchant.constants';
import { subMerchantFormSchema, type SubMerchantFormValues } from '../schemas';
import type { SubMerchant } from '../types';

interface SubMerchantFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget?: SubMerchant | null;
  onSubmit: (values: SubMerchantFormValues) => void;
  isSubmitting?: boolean;
}

const DEFAULT_VALUES: SubMerchantFormValues = {
  name: '',
  businessType: '',
  contact: '',
  status: 'active',
};

export function SubMerchantFormSheet({
  open,
  onOpenChange,
  editTarget,
  onSubmit,
  isSubmitting,
}: SubMerchantFormSheetProps) {
  const isEdit = !!editTarget;

  const form = useForm<SubMerchantFormValues>({
    resolver: zodResolver(subMerchantFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editTarget
          ? {
              name: editTarget.name,
              businessType: editTarget.businessType,
              contact: editTarget.contact,
              status: editTarget.status,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, editTarget, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isEdit ? 'Chỉnh sửa Sub-merchant' : 'Thêm Sub-merchant mới'}
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <SheetBody className="space-y-4">
              <FormField
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    label="Tên Sub-merchant"
                    placeholder="Nhập tên..."
                    description={fieldState.error?.message}
                    {...field}
                  />
                )}
              />
              <FormField
                name="businessType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <ComboBox
                    autocomplete
                    label="Loại hình kinh doanh"
                    placeholder="Chọn loại hình..."
                    value={field.value}
                    onValueChange={(val) =>
                      field.onChange(typeof val === 'string' ? val : (val[0] ?? ''))
                    }
                    options={BUSINESS_TYPE_OPTIONS}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <FormField
                name="contact"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    label="Thông tin liên hệ"
                    placeholder="Số điện thoại hoặc email..."
                    description={fieldState.error?.message}
                    {...field}
                  />
                )}
              />
              <FormField
                name="status"
                control={form.control}
                render={({ field }) => (
                  <ComboBox
                    autocomplete={false}
                    label="Trạng thái"
                    placeholder="Chọn trạng thái..."
                    value={field.value}
                    onValueChange={(val) =>
                      field.onChange(typeof val === 'string' ? val : (val[0] ?? 'active'))
                    }
                    options={SUB_MERCHANT_STATUS_OPTIONS.map((o) => ({
                      label: o.label,
                      value: o.value,
                    }))}
                  />
                )}
              />
            </SheetBody>
            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {isEdit ? 'Lưu thay đổi' : 'Thêm mới'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
