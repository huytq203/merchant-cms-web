"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input/Input";
import { Switch } from "@/components/ui/switch/Switch";
import { Textarea } from "@/components/ui/textarea/Textarea";
import type { MerchantFormValues, MerchantProfile, MerchantStagingIds } from "../types";
import { DocumentUploadField } from "./DocumentUploadField";

type Props = {
  form: UseFormReturn<MerchantFormValues>;
  merchant: MerchantProfile;
  disabled: boolean;
  onStagingChange: (key: keyof MerchantStagingIds, ids: string[]) => void;
  onRefreshLinks: () => void;
};

export function MerchantFormFields({ form, merchant, disabled, onStagingChange, onRefreshLinks }: Props) {
  const { register, control, formState } = form;
  const errors = formState.errors;
  return (
    <div className="grid gap-6">
      <section className="grid gap-4" aria-labelledby="merchant-info-title">
        <h3 id="merchant-info-title" className="text-sm font-semibold text-foreground">
          Thông tin ĐVCNTT
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Mã ngành nghề (MCC)"
            placeholder="Ví dụ: 5812"
            required
            disabled={disabled}
            inputMode="numeric"
            error={errors.mccCode?.message}
            {...register("mccCode")}
          />
          <Input
            label="Tên hiển thị"
            placeholder="Tên cửa hàng hiển thị cho khách hàng"
            required
            disabled={disabled}
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Địa chỉ website"
            disabled={disabled}
            placeholder="Ví dụ: https://congty.vn"
            error={errors.websiteUrl?.message}
            {...register("websiteUrl")}
          />
          <Input
            label="Người liên hệ / Hotline"
            placeholder="Ví dụ: 0912345678 hoặc Nguyễn Văn A"
            required
            disabled={disabled}
            error={errors.supportContact?.message}
            {...register("supportContact")}
          />
        </div>
        <Textarea
          label="Mô tả sản phẩm / dịch vụ"
          placeholder="Mô tả ngắn sản phẩm hoặc dịch vụ kinh doanh"
          disabled={disabled}
          error={errors.productDescription?.message}
          {...register("productDescription")}
        />
      </section>
      <section className="grid gap-4" aria-labelledby="merchant-images-title">
        <h3 id="merchant-images-title" className="text-sm font-semibold text-foreground">
          Hình ảnh
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DocumentUploadField
            type="MERCHANT_LOGO"
            disabled={disabled}
            existing={merchant.logoFile ? [merchant.logoFile] : []}
            onChange={(ids) => onStagingChange("logoStagingId", ids)}
            onRefreshLinks={onRefreshLinks}
          />
          <DocumentUploadField
            type="MERCHANT_PRODUCT_IMAGE"
            multiple
            disabled={disabled}
            existing={merchant.productImages ?? []}
            onChange={(ids) => onStagingChange("productImageStagingIds", ids)}
            onRefreshLinks={onRefreshLinks}
          />
        </div>
      </section>
      <section className="grid gap-4" aria-labelledby="merchant-contract-title">
        <h3 id="merchant-contract-title" className="text-sm font-semibold text-foreground">
          Hợp đồng ĐVCNTT
        </h3>
        <Controller
          name="contractSignedWithSub"
          control={control}
          render={({ field }) => (
            <Switch
              label="Ký hợp đồng riêng với từng Sub-merchant"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          )}
        />
        <DocumentUploadField
          type="MERCHANT_CONTRACT"
          disabled={disabled}
          existing={merchant.contractFile ? [merchant.contractFile] : []}
          onChange={(ids) => onStagingChange("contractStagingId", ids)}
          onRefreshLinks={onRefreshLinks}
        />
      </section>
    </div>
  );
}
