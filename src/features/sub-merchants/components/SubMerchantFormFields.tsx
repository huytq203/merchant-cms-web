'use client';

import { useWatch, type UseFormReturn } from 'react-hook-form';
import { Info, Lock } from 'lucide-react';
import { DetailItem, DetailList, DetailSection } from '@/components/modal/DetailModal';
import { InheritableField } from '@/components/form/InheritableField';
import { Input } from '@/components/ui/input/Input';
import type { SubMerchantFormValues } from '../schemas';
import type { SubMerchantDetail } from '../types';

type Form = UseFormReturn<SubMerchantFormValues>;

function LegalReadOnly({ detail }: { detail: SubMerchantDetail }) {
  return (
    <DetailSection title="Thông tin pháp lý" icon={<Lock className="h-4 w-4" />} aside="Lấy từ Master, không sửa tại đây" bare>
      <div className="rounded-xl border border-divider bg-page p-4">
        <DetailList>
          <DetailItem label="Mã số thuế"><span className="tabular-nums">{detail.taxCode || 'Chưa có'}</span></DetailItem>
          <DetailItem label="Tên pháp lý">{detail.legalName || 'Chưa có'}</DetailItem>
          <DetailItem label="Người đại diện pháp luật" wide>{detail.legalRepresentativeName || 'Chưa có'}</DetailItem>
        </DetailList>
      </div>
    </DetailSection>
  );
}

type InheritedFieldProps = {
  form: Form;
  inheritName: 'inheritPhone' | 'inheritAddress';
  valueName: 'phone' | 'address';
  label: string;
  placeholder: string;
};

function InheritedField({ form, inheritName, valueName, label, placeholder }: InheritedFieldProps) {
  const inherited = useWatch({ control: form.control, name: inheritName });

  return (
    <InheritableField
      label={label}
      sourceName="Master"
      inherited={inherited}
      onInheritedChange={(next) => {
        form.setValue(inheritName, next, { shouldDirty: true });
        void form.trigger(valueName);
      }}
    >
      {(id) => <Input id={id} placeholder={placeholder} error={form.formState.errors[valueName]?.message} {...form.register(valueName)} />}
    </InheritableField>
  );
}

function CreateIntro() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-divider bg-page px-3.5 py-2.5 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>Mã Sub-merchant do hệ thống cấp sau khi tạo. Thông tin pháp lý lấy từ Master.</span>
    </div>
  );
}

export function SubMerchantFormFields({ form, editTarget }: { form: Form; editTarget?: SubMerchantDetail | null }) {
  const { errors } = form.formState;
  return (
    <div className="flex flex-col gap-6">
      {editTarget ? null : <CreateIntro />}
      <DetailSection title="Thông tin chung" bare>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Tên Sub-merchant"
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
      </DetailSection>
      {editTarget ? <LegalReadOnly detail={editTarget} /> : null}
      <DetailSection title="Liên hệ" bare>
        <div className="flex flex-col gap-5">
          <InheritedField
            form={form}
            inheritName="inheritPhone"
            valueName="phone"
            label="Số điện thoại"
            placeholder="Ví dụ: 0912345678"
          />
          <InheritedField
            form={form}
            inheritName="inheritAddress"
            valueName="address"
            label="Địa chỉ"
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
          />
        </div>
      </DetailSection>
    </div>
  );
}
