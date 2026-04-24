'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ComboBox,
  Form,
  FormField,
  Input,
  Textarea,
} from '@/components/ui';
import { BUSINESS_TYPE_OPTIONS } from '../constants/SubMerchant.constants';
import { useCreateSubMerchantFull, useUpdateSubMerchantFull } from '../hooks/use-sub-merchant-mutations';
import { newSubMerchantSchema, type NewSubMerchantFormValues } from '../schemas';
import type { SubMerchant } from '../types';
import { BankAccountSection } from './BankAccountSection';
import { NotificationSection } from './NotificationSection';

interface NewSubMerchantFormProps {
  initialData?: SubMerchant;
}

const DEFAULT_VALUES: NewSubMerchantFormValues = {
  name: '',
  businessType: '',
  taxCode: '',
  representative: '',
  address: '',
  webhookUrl: '',
  bankName: '',
  bankBranch: '',
  accountNumber: '',
  accountName: '',
  notifyEnabled: false,
  notifyTxSuccess: true,
  notifyTxFailed: false,
  notifyDispute: true,
  notifyFreeze: true,
  notifyPolicyChange: false,
  notifyEmails: '',
  eInvoiceEnabled: false,
  eInvoiceEmails: '',
};

function generateAlphanumeric(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function toFormValues(data: SubMerchant): NewSubMerchantFormValues {
  return {
    name: data.name,
    businessType: data.businessType,
    taxCode: data.taxCode ?? '',
    representative: data.representative ?? '',
    address: data.address ?? '',
    webhookUrl: data.webhookUrl ?? '',
    bankName: data.bankName ?? '',
    bankBranch: data.bankBranch ?? '',
    accountNumber: data.accountNumber ?? '',
    accountName: data.accountName ?? '',
    notifyEnabled: data.notifyEnabled ?? false,
    notifyTxSuccess: data.notifyTxSuccess ?? true,
    notifyTxFailed: data.notifyTxFailed ?? false,
    notifyDispute: data.notifyDispute ?? true,
    notifyFreeze: data.notifyFreeze ?? true,
    notifyPolicyChange: data.notifyPolicyChange ?? false,
    notifyEmails: data.notifyEmails ?? '',
    eInvoiceEnabled: data.eInvoiceEnabled ?? false,
    eInvoiceEmails: data.eInvoiceEmails ?? '',
  };
}

export function NewSubMerchantForm({ initialData }: NewSubMerchantFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData;

  const { mutate: createMutate, isPending: isCreating } = useCreateSubMerchantFull();
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateSubMerchantFull(initialData?.id ?? '');
  const isPending = isCreating || isUpdating;

  const previewKeys = useMemo(
    () => ({
      merchantId: initialData?.merchantId ?? `MCH-${generateAlphanumeric(8).toUpperCase()}`,
      accessKey: initialData?.accessKey ?? generateAlphanumeric(24),
      secretKey: initialData?.secretKey ?? generateAlphanumeric(48),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const form = useForm<NewSubMerchantFormValues>({
    resolver: zodResolver(newSubMerchantSchema),
    defaultValues: initialData ? toFormValues(initialData) : DEFAULT_VALUES,
  });

  const ctrl = form.control;

  const onSubmit = (values: NewSubMerchantFormValues) => {
    const payload = { ...values, ...previewKeys, contact: values.notifyEmails ?? '' };

    if (isEditMode) {
      updateMutate(payload, {
        onSuccess: () => {
          toast.success('Cập nhật Sub-merchant thành công');
          router.push('/sub-merchants');
        },
        onError: () => toast.error('Cập nhật Sub-merchant thất bại'),
      });
    } else {
      createMutate(payload, {
        onSuccess: () => {
          toast.success('Tạo Sub-merchant thành công');
          router.push('/sub-merchants');
        },
        onError: () => toast.error('Tạo Sub-merchant thất bại'),
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Thông tin chung */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Thông tin chung</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              name="name"
              control={ctrl}
              render={({ field, fieldState }) => (
                <Input
                  label="Tên Sub-merchant"
                  required
                  placeholder="Nhập tên cửa hàng/thương hiệu"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
            <FormField
              name="businessType"
              control={ctrl}
              render={({ field, fieldState }) => (
                <ComboBox
                  autocomplete
                  label="Lĩnh vực kinh doanh"
                  required
                  placeholder="-- Chọn lĩnh vực --"
                  value={field.value}
                  onValueChange={(v) => field.onChange(typeof v === 'string' ? v : (v[0] ?? ''))}
                  options={BUSINESS_TYPE_OPTIONS}
                  error={fieldState.error?.message}
                />
              )}
            />
            <FormField
              name="taxCode"
              control={ctrl}
              render={({ field }) => (
                <Input
                  label="Mã số thuế (Không bắt buộc)"
                  placeholder="Mặc định dùng MST của Master Merchant"
                  {...field}
                />
              )}
            />
            <FormField
              name="representative"
              control={ctrl}
              render={({ field }) => (
                <Input
                  label="Người đại diện (Không bắt buộc)"
                  placeholder="Mặc định dùng của Master Merchant"
                  {...field}
                />
              )}
            />
            <FormField
              name="address"
              control={ctrl}
              render={({ field, fieldState }) => (
                <div className="md:col-span-2">
                  <Textarea
                    label="Địa chỉ trụ sở"
                    required
                    showCount
                    maxLength={255}
                    minLength={1}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                    error={fieldState.error?.message}
                    {...field}
                  />
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 2: Key kết nối */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Key kết nối</CardTitle>
            <CardDescription>Merchant ID và Access Key được tạo tự động sau khi lưu</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Merchant ID (Auto)" value={previewKeys.merchantId} readOnly />
            <Input label="Access Key" value={previewKeys.accessKey} readOnly />
            <Input label="Secret Key" value={previewKeys.secretKey} type="password" readOnly />
            <FormField
              name="webhookUrl"
              control={ctrl}
              render={({ field, fieldState }) => (
                <Input
                  label="Webhook URL"
                  placeholder="https://yourdomain.com/callback"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
          </CardContent>
        </Card>

        <BankAccountSection control={ctrl} />

        <NotificationSection control={ctrl} />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Hủy bỏ
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEditMode ? 'Lưu thay đổi' : 'Lưu thiết lập'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
