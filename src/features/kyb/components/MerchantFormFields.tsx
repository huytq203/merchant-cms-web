"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { Switch } from "@/components/ui/switch/Switch";
import { Textarea } from "@/components/ui/textarea/Textarea";
import type { MerchantFormValues, MerchantProfile, MerchantStagingIds } from "../types";
import { mccOptionsFor } from "../constants/mcc-options";
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
          <Controller
            name="mccCode"
            control={control}
            render={({ field }) => (
              <Select
                label="Ngành nghề kinh doanh (MCC)"
                placeholder="Chọn ngành nghề"
                clearable={false}
                disabled={disabled}
                options={mccOptionsFor(field.value)}
                value={field.value}
                onChange={field.onChange}
                error={errors.mccCode?.message}
              />
            )}
          />
          <Input
            label="Tên hiển thị"
            description="Hiện cho khách hàng khi thanh toán."
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
            placeholder="Họ tên và số hotline hỗ trợ"
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
            <div className="grid gap-1.5">
              <Switch
                label="Ký hợp đồng riêng với từng Sub-merchant"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                {field.value
                  ? "Đang bật: mỗi Sub-merchant ký hợp đồng riêng. Hợp đồng ở cấp Master là tùy chọn."
                  : "Đang tắt: ký một hợp đồng ở cấp Master cho mọi Sub-merchant."}
              </p>
            </div>
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
