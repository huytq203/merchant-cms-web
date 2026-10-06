'use client';

import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import { Input } from '@/components/ui/input/Input';
import type { SubMerchantFormValues } from '../schemas';
import type { SubMerchantDetail } from '../types';

type Form = UseFormReturn<SubMerchantFormValues>;

function LegalReadOnly({ detail }: { detail: SubMerchantDetail }) {
  return (
    <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm">
      <div>
        <dt>Mã số thuế</dt>
        <dd>{detail.taxCode ?? '—'}</dd>
      </div>
      <div>
        <dt>Tên pháp lý</dt>
        <dd>{detail.legalName ?? '—'}</dd>
      </div>
      <div className="col-span-2">
        <dt>Người đại diện pháp luật</dt>
        <dd>{detail.legalRepresentativeName ?? '—'}</dd>
      </div>
    </dl>
  );
}

type InheritedFieldProps = {
  form: Form;
  inheritName: 'inheritPhone' | 'inheritAddress';
  valueName: 'phone' | 'address';
  inheritLabel: string;
  valueLabel: string;
  valuePlaceholder: string;
};

function InheritedField({ form, inheritName, valueName, inheritLabel, valueLabel, valuePlaceholder }: InheritedFieldProps) {
  const inherited = useWatch({ control: form.control, name: inheritName });
  return (
    <>
      <Controller
        name={inheritName}
        control={form.control}
        render={({ field }) => (
          <Checkbox
            label={inheritLabel}
            checked={field.value}
            onCheckedChange={(checked) => {
              field.onChange(checked === true);
              void form.trigger(valueName);
            }}
          />
        )}
      />
      <Input
        label={valueLabel}
        placeholder={valuePlaceholder}
        disabled={inherited}
        error={form.formState.errors[valueName]?.message}
        {...form.register(valueName)}
      />
    </>
  );
}

export function SubMerchantFormFields({ form, editTarget }: { form: Form; editTarget?: SubMerchantDetail | null }) {
  const { errors } = form.formState;
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Tên điểm bán"
          placeholder="Ví dụ: Cửa hàng Quận 1"
          required
          error={errors.name?.message}
          {...form.register('name')}
        />
        <Input
          label="Lĩnh vực kinh doanh"
          placeholder="Ví dụ: Ăn uống, bán lẻ"
          error={errors.businessField?.message}
          {...form.register('businessField')}
        />
      </div>
      {editTarget ? <LegalReadOnly detail={editTarget} /> : null}
      <InheritedField
        form={form}
        inheritName="inheritPhone"
        valueName="phone"
        inheritLabel="Kế thừa điện thoại"
        valueLabel="Số điện thoại"
        valuePlaceholder="Ví dụ: 0912345678"
      />
      <InheritedField
        form={form}
        inheritName="inheritAddress"
        valueName="address"
        inheritLabel="Kế thừa địa chỉ"
        valueLabel="Địa chỉ"
        valuePlaceholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
      />
    </>
  );
}
