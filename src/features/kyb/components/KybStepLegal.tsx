"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import type { WalletFormValues } from "../types";

const BUSINESS_TYPE_OPTIONS = [
  { value: "ENTERPRISE", label: "Doanh nghiệp" },
  { value: "HOUSEHOLD", label: "Hộ kinh doanh" },
];

type Props = { form: UseFormReturn<WalletFormValues> };

export function KybStepLegal({ form }: Props) {
  const { register, control, formState } = form;
  const errors = formState.errors;
  return (
    <section className="grid gap-4" aria-labelledby="kyb-legal-title">
      <h3 id="kyb-legal-title" className="text-sm font-semibold text-foreground">
        Thông tin doanh nghiệp
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="businessType"
          control={control}
          render={({ field }) => (
            <Select
              label="Loại hình"
              placeholder="Chọn loại hình doanh nghiệp"
              options={BUSINESS_TYPE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.businessType?.message}
            />
          )}
        />
        <Input
          label="Email đăng ký"
          type="email"
          disabled
          description="Email đăng ký không thể thay đổi"
          {...register("registeredEmail")}
        />
        <Input
          label="Tên pháp nhân / doanh nghiệp"
          required
          placeholder="Nhập tên theo giấy đăng ký kinh doanh"
          error={errors.legalName?.message}
          {...register("legalName")}
        />
        <Input
          label="Mã số thuế (MST)"
          placeholder="Nhập 10 hoặc 13 chữ số"
          required
          inputMode="numeric"
          autoComplete="off"
          error={errors.taxCode?.message}
          {...register("taxCode")}
        />
      </div>
      <Input
        label="Địa chỉ trụ sở / ĐKKD"
        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
        required
        error={errors.headOfficeAddress?.message}
        {...register("headOfficeAddress")}
      />
    </section>
  );
}
