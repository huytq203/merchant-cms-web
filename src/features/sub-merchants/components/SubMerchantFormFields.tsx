'use client';

import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { Info, Lock } from 'lucide-react';
import { DetailItem, DetailList, DetailSection } from '@/components/modal/DetailModal';
import { InheritableField } from '@/components/form/InheritableField';
import { Input } from '@/components/ui/input/Input';
import { Select } from '@/components/ui/select/Select';
import { DocumentUploadField } from '@/features/kyb/components/DocumentUploadField';
import type { BusinessCategoryOption } from '@/features/business-categories/utils';
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

type FieldsProps = {
  form: Form;
  editTarget?: SubMerchantDetail | null;
  /** Lựa chọn ngành nghề đã dựng sẵn (nhãn "<tên> (MCC <mã>)", có cả mã đang lưu); rỗng khi đang tải hoặc tải lỗi (dropdown hiện "Không tìm thấy"). */
  categories?: BusinessCategoryOption[];
  categoriesLoading?: boolean;
  /**
   * Master đã bật "Ký hợp đồng riêng với Sub-merchant" nên Sub mới bắt buộc có hợp đồng. Khi chưa biết (chưa tải được
   * hồ sơ Master) truyền false: ô tải lên vẫn hiện, tùy chọn, và BE (mã 5205) là chốt chặn cuối.
   */
  contractRequired?: boolean;
  onRefreshLinks?: () => void;
};

/**
 * Hợp đồng riêng của Sub. Thêm mới luôn hiện ô tải lên (bắt buộc khi Master ký riêng từng Sub). Sửa chỉ hiện khi Sub
 * thuộc diện phải có hợp đồng (`contractRequired`): hiện bản đang có và cho thay bản mới; không tải thì giữ bản cũ.
 */
function ContractSection({ form, editTarget, contractRequired, onRefreshLinks }: Pick<FieldsProps, 'form' | 'editTarget' | 'contractRequired' | 'onRefreshLinks'>) {
  if (editTarget && !editTarget.contractRequired) return null;
  const existing = editTarget?.contractFile ? [editTarget.contractFile] : [];
  return (
    <DetailSection title="Hợp đồng" bare>
      <DocumentUploadField
        type="MERCHANT_CONTRACT"
        label="Hợp đồng riêng của Sub-merchant"
        required={!editTarget && contractRequired}
        existing={existing}
        error={form.formState.errors.contractStagingId?.message}
        onRefreshLinks={onRefreshLinks}
        onChange={(ids) => form.setValue('contractStagingId', ids[0] ?? '', { shouldDirty: true, shouldValidate: true })}
      />
    </DetailSection>
  );
}

export function SubMerchantFormFields({ form, editTarget, categories = [], categoriesLoading, contractRequired = false, onRefreshLinks }: FieldsProps) {
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
          <Controller
            name="mccCode"
            control={form.control}
            render={({ field }) => (
              <Select
                label="Lĩnh vực kinh doanh"
                placeholder={categoriesLoading ? 'Đang tải danh mục...' : 'Chọn ngành nghề'}
                description={editTarget ? undefined : 'Mặc định theo ngành nghề của Master.'}
                clearable={false}
                options={categories}
                value={field.value}
                onChange={field.onChange}
                error={errors.mccCode?.message}
              />
            )}
          />
        </div>
      </DetailSection>
      <ContractSection form={form} editTarget={editTarget} contractRequired={contractRequired} onRefreshLinks={onRefreshLinks} />
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
