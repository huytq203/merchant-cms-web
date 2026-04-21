'use client';
import {
  Button,
  DatePicker,
  Form,
  FormField,
  Input,
} from '@/components/ui';
import * as Card from '@/components/ui/card/Card';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Building2, FileText, Save, User, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import mockData from '@/mock/data-merchant.json';
import { createMerchantSchema, type CreateMerchantValues } from '../schemas';
import { useCreateMerchantMutation } from '../hooks/use-merchant-mutations';
import Link from 'next/link';

const MERCHANT_TYPES = [
  { value: 'individual', label: 'Cá nhân' },
  { value: 'household', label: 'Hộ kinh doanh' },
  { value: 'business', label: 'Doanh nghiệp' },
];

interface SelectFieldProps {
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

function SelectField({ label, required, options, value, onChange, placeholder, error }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:border-primary disabled:opacity-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder ?? '-- Chọn --'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function CreateMerchantForm() {
  const router = useRouter();
  const { mutate, isPending } = useCreateMerchantMutation();
  const [isDirty, setIsDirty] = useState(false);

  const form = useForm<CreateMerchantValues>({
    resolver: zodResolver(createMerchantSchema),
    defaultValues: {
      email: '',
      phone: '',
      name: '',
      merchantType: undefined,
      taxCode: '',
      businessType: '',
      copyEmail: false,
      emailReconciliation: '',
      emailInvoice: '',
      address: '',
      representativeName: '',
      representativePosition: '',
      representativeCccd: '',
      representativeCccdExpiry: '',
      representativeOtpPhone: '',
    },
  });

  const watchedMerchantType = useWatch({ control: form.control, name: 'merchantType' });
  const watchedEmail = useWatch({ control: form.control, name: 'email' });
  const watchedCopyEmail = useWatch({ control: form.control, name: 'copyEmail' });
  const needsTaxAndLicense = watchedMerchantType && watchedMerchantType !== 'individual';

  useEffect(() => {
    if (watchedCopyEmail && watchedEmail) {
      form.setValue('emailReconciliation', watchedEmail);
      form.setValue('emailInvoice', watchedEmail);
    }
  }, [watchedCopyEmail, watchedEmail, form]);

  const handleSubmit = (values: CreateMerchantValues) => {
    mutate(values as unknown as Record<string, unknown>, {
      onSuccess: () => router.push('/merchants'),
    });
  };

  const handleBack = () => {
    if (isDirty) {
      if (!confirm('Dữ liệu chưa lưu sẽ bị mất. Bạn có chắc muốn thoát?')) return;
    }
    router.push('/merchants');
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        onChange={() => setIsDirty(true)}
        className="space-y-6"
      >
        {/* Top nav */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Thêm mới merchant</h1>
              <p className="text-sm text-muted-foreground">Điền đầy đủ thông tin để tạo hồ sơ merchant</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              leftIcon={<Save className="h-4 w-4" />}
              onClick={() => form.handleSubmit(() => {})()}
            >
              Lưu nháp
            </Button>
            <Button type="submit" size="md" isLoading={isPending}>
              Hoàn tất & Tạo
            </Button>
          </div>
        </div>

        {/* Section II: Account info */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Thông tin tài khoản
            </Card.CardTitle>
          </Card.CardHeader>
          <Card.CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Input
                  label="Email đăng ký"
                  required
                  placeholder="example@domain.com"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
            <FormField
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Input
                  label="SĐT liên hệ"
                  required
                  placeholder="0901234567"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
          </Card.CardContent>
        </Card.Card>

        {/* Section III: Business identity */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Định danh doanh nghiệp
            </Card.CardTitle>
          </Card.CardHeader>
          <Card.CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    label="Tên merchant"
                    required
                    placeholder="Tên thương hiệu / cửa hàng"
                    error={fieldState.error?.message}
                    {...field}
                  />
                )}
              />
              <FormField
                name="merchantType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <SelectField
                    label="Loại merchant"
                    required
                    options={MERCHANT_TYPES}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {needsTaxAndLicense && (
                <FormField
                  name="taxCode"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Input
                      label="Mã số thuế"
                      required
                      placeholder="10 hoặc 13 chữ số"
                      error={fieldState.error?.message}
                      {...field}
                    />
                  )}
                />
              )}
              <FormField
                name="businessType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <SelectField
                    label="Lĩnh vực kinh doanh"
                    required
                    options={mockData.businessTypes}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <div className="flex items-center gap-2 py-1">
              <FormField
                name="copyEmail"
                control={form.control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                    Sao chép email đăng ký cho email đối soát & hóa đơn
                  </label>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                name="emailReconciliation"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    label="Email đối soát"
                    required
                    placeholder="email@domain.com"
                    error={fieldState.error?.message}
                    disabled={watchedCopyEmail}
                    {...field}
                  />
                )}
              />
              <FormField
                name="emailInvoice"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    label="Email hóa đơn"
                    required
                    placeholder="email@domain.com"
                    error={fieldState.error?.message}
                    disabled={watchedCopyEmail}
                    {...field}
                  />
                )}
              />
            </div>

            <FormField
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Địa chỉ trụ sở <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:border-primary resize-none"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                    maxLength={500}
                    {...field}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
          </Card.CardContent>
        </Card.Card>

        {/* Section IV: Representative */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-muted-foreground" />
              Người đại diện
            </Card.CardTitle>
          </Card.CardHeader>
          <Card.CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              name="representativeName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Input
                  label="Họ và tên"
                  required
                  placeholder="Nguyễn Văn A"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
            <FormField
              name="representativePosition"
              control={form.control}
              render={({ field, fieldState }) => (
                <Input
                  label="Chức vụ"
                  required
                  placeholder="Giám đốc / Chủ hộ"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
            <FormField
              name="representativeCccd"
              control={form.control}
              render={({ field, fieldState }) => (
                <Input
                  label="Số CCCD"
                  required
                  placeholder="9 hoặc 12 chữ số"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
            <FormField
              name="representativeCccdExpiry"
              control={form.control}
              render={({ field, fieldState }) => (
                <DatePicker
                  label="Ngày hết hạn CCCD"
                  placeholder="Chọn ngày"
                  date={field.value ? new Date(field.value) : undefined}
                  onDateChange={(d) => {
                    if (d instanceof Date) {
                      field.onChange(d.toISOString().split('T')[0]);
                    } else {
                      field.onChange('');
                    }
                  }}
                  disablePastDates
                  error={fieldState.error?.message}
                />
              )}
            />
            <FormField
              name="representativeOtpPhone"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    SĐT nhận OTP <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="0901234567"
                      error={fieldState.error?.message}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      className="shrink-0 text-xs"
                      onClick={() =>
                        form.setValue('representativeOtpPhone', form.getValues('phone'))
                      }
                    >
                      Sao chép từ SĐT liên hệ
                    </Button>
                  </div>
                </div>
              )}
            />
          </Card.CardContent>
        </Card.Card>

        {/* Section V: Legal documents */}
        <Card.Card>
          <Card.CardHeader>
            <Card.CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Hồ sơ pháp lý
            </Card.CardTitle>
            <Card.CardDescription>
              Ảnh: JPG/PNG tối đa 5MB · Tài liệu: PDF tối đa 10MB
            </Card.CardDescription>
          </Card.CardHeader>
          <Card.CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <UploadBox label="CCCD mặt trước" required accept="image/*" />
            <UploadBox label="CCCD mặt sau" required accept="image/*" />
            {needsTaxAndLicense && (
              <UploadBox label="Đăng ký kinh doanh" required accept="image/*,.pdf" />
            )}
            <UploadBox label="Hợp đồng hợp tác" required accept=".pdf" hint="PDF nhiều trang" />
          </Card.CardContent>
        </Card.Card>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Link href="/merchants">
            <Button type="button" variant="outline" size="md">
              Hủy
            </Button>
          </Link>
          <Button type="submit" size="md" isLoading={isPending}>
            Hoàn tất & Tạo
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface UploadBoxProps {
  label: string;
  required?: boolean;
  accept?: string;
  hint?: string;
}

function UploadBox({ label, required, accept, hint }: UploadBoxProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(file.name);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && <span className="ml-1 text-xs text-muted-foreground">({hint})</span>}
      </label>
      <label className="relative flex flex-col items-center justify-center h-36 rounded-lg border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
        {preview ? (
          preview.startsWith('blob:') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={label} className="h-full w-full object-contain rounded-lg" />
          ) : (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="truncate max-w-[150px]">{preview}</span>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <FileText className="h-8 w-8 opacity-40" />
            <span className="text-xs">Click để tải lên</span>
          </div>
        )}
        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept={accept} onChange={handleChange} />
      </label>
    </div>
  );
}
