'use client';
import { type Control } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, ComboBox, FormField, Input } from '@/components/ui';
import { BANK_OPTIONS } from '../constants/SubMerchant.constants';
import { type NewSubMerchantFormValues } from '../schemas';

interface BankAccountSectionProps {
  control: Control<NewSubMerchantFormValues>;
}

export function BankAccountSection({ control }: BankAccountSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">3. Tài khoản ngân hàng</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          name="bankName"
          control={control}
          render={({ field, fieldState }) => (
            <ComboBox
              autocomplete
              label="Ngân hàng thụ hưởng"
              required
              placeholder="Chọn ngân hàng"
              value={field.value}
              onValueChange={(v) => field.onChange(typeof v === 'string' ? v : (v[0] ?? ''))}
              options={BANK_OPTIONS}
              error={fieldState.error?.message}
            />
          )}
        />
        <FormField
          name="bankBranch"
          control={control}
          render={({ field }) => (
            <Input label="Chi nhánh" placeholder="Nhập chi nhánh mở thẻ" {...field} />
          )}
        />
        <FormField
          name="accountNumber"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              label="Số tài khoản"
              required
              placeholder="Nhập số tài khoản thanh toán"
              error={fieldState.error?.message}
              {...field}
            />
          )}
        />
        <FormField
          name="accountName"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              label="Tên chủ tài khoản"
              required
              placeholder="Tên in trên thẻ (không dấu)"
              error={fieldState.error?.message}
              {...field}
            />
          )}
        />
      </CardContent>
    </Card>
  );
}
