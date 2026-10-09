"use client";

import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { walletFormSchema } from "../schemas/enterprise-wallet.schema";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { useQuery } from "@tanstack/react-query";
import { kybQueries } from "../kyb-queries";
import type { IdentityChanges } from "../utils/kyb-rekyb";
import type { WalletFormValues } from "../types";
import { KybFieldNote } from "./KybFieldNote";

const BUSINESS_TYPE_OPTIONS = [
  { value: "ENTERPRISE", label: "Doanh nghiệp" },
  { value: "HOUSEHOLD", label: "Hộ kinh doanh" },
];

type Props = {
  form: UseFormReturn<WalletFormValues>;
  walletId: string;
  /** Set only for a verified dossier: which identity fields the user has changed. */
  changes: IdentityChanges | null;
};

/** The usage lookup only runs once the code is complete, so typing never fires a request per key. */
function TaxCodeNote({ walletId, taxCode, changed }: { walletId: string; taxCode: string; changed: boolean }) {
  const complete = walletFormSchema.shape.taxCode.safeParse(taxCode).success;
  const usage = useQuery({ ...kybQueries.taxCodeUsage(walletId, taxCode), enabled: complete });
  return (
    <>
      {changed && <KybFieldNote tone="warning">Đổi mã số thuế sẽ đưa hồ sơ về Chờ duyệt KYB.</KybFieldNote>}
      {complete && usage.data?.length === 0 && (
        <KybFieldNote tone="success">Mã số thuế chưa được đăng ký ở ví khác.</KybFieldNote>
      )}
      {complete && usage.data && usage.data.length > 0 && (
        <KybFieldNote tone="warning">{`Mã số thuế này đã có ở ví: ${usage.data.join(", ")}.`}</KybFieldNote>
      )}
    </>
  );
}

export function KybStepLegal({ form, walletId, changes }: Props) {
  const { register, control, formState } = form;
  const taxCode = useWatch({ control, name: "taxCode" });
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
        <div>
          <Input
            label="Tên pháp nhân / doanh nghiệp"
            required
            placeholder="Nhập tên theo giấy đăng ký kinh doanh"
            error={errors.legalName?.message}
            {...register("legalName")}
          />
          {changes?.legalName && <KybFieldNote tone="warning">Đổi tên pháp nhân sẽ đưa hồ sơ về Chờ duyệt KYB.</KybFieldNote>}
        </div>
        <div>
          <Input
            label="Mã số thuế (MST)"
            placeholder="Nhập 10 hoặc 13 chữ số"
            required
            inputMode="numeric"
            autoComplete="off"
            error={errors.taxCode?.message}
            {...register("taxCode")}
          />
          <TaxCodeNote walletId={walletId} taxCode={taxCode} changed={Boolean(changes?.taxCode)} />
        </div>
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
