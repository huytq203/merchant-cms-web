"use client";

import { SegmentedControl } from "@/components/form/SegmentedControl";
import { Select } from "@/components/ui/select/Select";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import type { BankAccountFormValues } from "../types";

type Props = {
  values: BankAccountFormValues;
  error?: string;
  onChange: <K extends keyof BankAccountFormValues>(field: K, value: BankAccountFormValues[K]) => void;
};

const scopeOptions = [
  { value: "MASTER" as const, label: "Cấp Master" },
  { value: "SUB" as const, label: "Cấp Sub-merchant" },
];

const hints = {
  MASTER: "Mọi Sub-merchant chưa có tài khoản riêng sẽ nhận quyết toán về tài khoản này.",
  SUB: "Chỉ Sub-merchant này nhận quyết toán về tài khoản này. Thay đổi sau này cần Flexpay phê duyệt.",
} as const;

/** Adding only: an account belongs to exactly one level, so the level is chosen before the bank details. */
export function BankAccountScopeField({ values, error, onChange }: Props) {
  const scope = values.scope ?? "MASTER";
  const subMerchants = useSubMerchantOptions();
  const options = subMerchants.data?.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })) ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Áp dụng cho</span>
        <SegmentedControl
          fullWidth
          ariaLabel="Cấp áp dụng của tài khoản"
          options={scopeOptions}
          value={scope}
          onChange={(next) => {
            onChange("scope", next);
            if (next === "MASTER") onChange("subMerchantId", "");
          }}
        />
        <p className="text-xs text-muted-foreground">{hints[scope]}</p>
      </div>
      {scope === "SUB" && (
        <Select
          label="Sub-merchant"
          placeholder={subMerchants.isPending ? "Đang tải..." : "Chọn Sub-merchant"}
          clearable={false}
          value={values.subMerchantId ?? ""}
          error={error}
          options={options}
          onChange={(value) => onChange("subMerchantId", value)}
        />
      )}
    </div>
  );
}
