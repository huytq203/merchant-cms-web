'use client';
import { type Control } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, Checkbox, FormField, Input, Textarea } from '@/components/ui';
import { type NewSubMerchantFormValues } from '../schemas';

interface NotificationSectionProps {
  control: Control<NewSubMerchantFormValues>;
}

const NOTIFY_TYPES: { name: keyof NewSubMerchantFormValues; label: string }[] = [
  { name: 'notifyTxSuccess',    label: 'Giao dịch phát sinh thành công'    },
  { name: 'notifyTxFailed',     label: 'Giao dịch thất bại / Hoàn tiền'    },
  { name: 'notifyDispute',      label: 'Khiếu nại từ khách hàng (Dispute)' },
  { name: 'notifyFreeze',       label: 'Thông báo Đóng băng / Cảnh báo'    },
  { name: 'notifyPolicyChange', label: 'Thay đổi chính sách / Hợp đồng'   },
];

export function NotificationSection({ control }: NotificationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">4. Cấu hình thông báo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Thông báo vận hành */}
        <div className="rounded-lg border border-border p-4 space-y-4">
          <FormField
            name="notifyEnabled"
            control={control}
            render={({ field }) => (
              <Checkbox
                label="Kích hoạt nhận thông báo vận hành"
                checked={field.value as boolean}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Chọn loại thông báo muốn nhận qua Email:
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {NOTIFY_TYPES.map(({ name, label }) => (
                <FormField
                  key={name}
                  name={name}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      label={label}
                      checked={field.value as boolean}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              ))}
            </div>
          </div>
          <FormField
            name="notifyEmails"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Email nhận thông báo vận hành"
                placeholder="Để trống sẽ gửi về Email Master Merchant. Dùng dấu phẩy (,) để nhập nhiều email."
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
        </div>

        {/* Hóa đơn điện tử */}
        <div className="rounded-lg border border-border p-4 space-y-4">
          <p className="font-semibold text-foreground">Hóa đơn điện tử (E-Invoice)</p>
          <FormField
            name="eInvoiceEnabled"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="eInvoiceEnabled"
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                />
                <label
                  htmlFor="eInvoiceEnabled"
                  className="text-sm font-medium text-primary cursor-pointer select-none"
                >
                  Kích hoạt nhận hóa đơn riêng
                </label>
              </div>
            )}
          />
          <FormField
            name="eInvoiceEmails"
            control={control}
            render={({ field, fieldState }) => (
              <Textarea
                label="Danh sách Email nhận hóa đơn"
                placeholder="Ví dụ: ketoan@congty.com, admin@congty.com..."
                rows={3}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">
            * Nếu không nhập, hệ thống mặc định gửi về Email chính của Sub-merchant (đã khai báo tại Bước 1).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
