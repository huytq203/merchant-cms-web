"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { DatePicker } from "@/components/ui/datepicker/DatePicker";
import { Input } from "@/components/ui/input/Input";
import type { IdentityChanges } from "../utils/kyb-rekyb";
import type { WalletFormValues } from "../types";
import { KybFieldNote } from "./KybFieldNote";
import { formatIsoDate, parseIsoDate } from "../utils/date-value";

type Props = {
  form: UseFormReturn<WalletFormValues>;
  /** Set only for a verified dossier: which identity fields the user has changed. */
  changes: IdentityChanges | null;
};

export function KybStepRepresentative({ form, changes }: Props) {
  const { register, control, formState } = form;
  const errors = formState.errors;
  return (
    <div className="grid gap-6">
      <section className="grid gap-4" aria-labelledby="kyb-representative-title">
        <h3 id="kyb-representative-title" className="text-sm font-semibold text-foreground">
          Người đại diện pháp luật
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Input
              label="Họ và tên người đại diện"
              placeholder="Ví dụ: Nguyễn Văn A"
              required
              error={errors.legalRepresentativeName?.message}
              {...register("legalRepresentativeName")}
            />
            {changes?.legalRepresentativeName && (
              <KybFieldNote tone="warning">Đổi người đại diện sẽ đưa hồ sơ về Chờ duyệt KYB.</KybFieldNote>
            )}
          </div>
          <Input
            label="Số CCCD / Hộ chiếu người đại diện"
            placeholder="Nhập 9 hoặc 12 ký tự"
            required
            autoComplete="off"
            error={errors.legalRepresentativeIdNumber?.message}
            {...register("legalRepresentativeIdNumber")}
          />
        </div>
      </section>
      <section className="grid gap-4" aria-labelledby="kyb-manager-title">
        <h3 id="kyb-manager-title" className="text-sm font-semibold text-foreground">
          Người quản lý ví
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Họ và tên người quản lý"
            placeholder="Ví dụ: Trần Thị B"
            required
            error={errors.managerName?.message}
            {...register("managerName")}
          />
          <Input
            label="Chức vụ"
            required
            placeholder="Ví dụ: Giám đốc"
            error={errors.managerTitle?.message}
            {...register("managerTitle")}
          />
          <Input
            label="Số CCCD người quản lý"
            placeholder="Nhập 12 chữ số"
            required
            inputMode="numeric"
            autoComplete="off"
            error={errors.managerIdNumber?.message}
            {...register("managerIdNumber")}
          />
          <Controller
            name="managerIdExpiryDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Ngày hết hạn giấy tờ"
                placeholder="Chọn ngày hết hạn"
                required
                disablePastDates
                value={parseIsoDate(field.value)}
                onChange={(date) => field.onChange(formatIsoDate(date))}
                error={errors.managerIdExpiryDate?.message}
              />
            )}
          />
        </div>
      </section>
      <section className="grid gap-4" aria-labelledby="kyb-contact-title">
        <h3 id="kyb-contact-title" className="text-sm font-semibold text-foreground">
          Thông tin liên hệ
        </h3>
        <Input
          label="SĐT nhận thông báo"
          description="Mã OTP gửi về email đăng ký, không gửi tới số này."
          placeholder="Ví dụ: 0912345678"
          required
          inputMode="tel"
          autoComplete="off"
          error={errors.otpPhone?.message}
          {...register("otpPhone")}
        />
      </section>
    </div>
  );
}
