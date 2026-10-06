"use client";

import { ComboBox } from "@/components/ui";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const firstValue = (value: string | string[]) => (typeof value === "string" ? value : (value[0] ?? ""));

/** Sub-merchant filter backed by the real BE list; render it only when fixture ids cannot clash with it. */
export function SubMerchantFilterField({ value, onChange }: Props) {
  const { data: subMerchants } = useSubMerchantOptions();
  const options = (subMerchants ?? []).map((item) => ({ value: item.id, label: item.name }));
  return (
    <ComboBox
      autocomplete
      label="Sub-merchant"
      placeholder="Tất cả sub-merchant"
      value={value}
      onValueChange={(next) => onChange(firstValue(next))}
      options={options}
    />
  );
}
