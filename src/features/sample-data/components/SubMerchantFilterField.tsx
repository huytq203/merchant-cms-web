"use client";

import { ComboBox } from "@/components/ui";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /**
   * Adds a "Tất cả sub-merchant" option that selects "no filter" (value ""), so the user can go back to all Subs
   * from the list. Off by default: the other filter forms clear the field with the X instead.
   */
  allowAll?: boolean;
};

const ALL = "__all__";

const firstValue = (value: string | string[]) => (typeof value === "string" ? value : (value[0] ?? ""));

/** Sub-merchant filter backed by the real BE list; render it only when fixture ids cannot clash with it. */
export function SubMerchantFilterField({ value, onChange, allowAll = false }: Props) {
  const { data: subMerchants } = useSubMerchantOptions();
  const subOptions = (subMerchants ?? []).map((item) => ({ value: item.id, label: item.name }));
  const options = allowAll ? [{ value: ALL, label: "Tất cả sub-merchant" }, ...subOptions] : subOptions;
  return (
    <ComboBox
      autocomplete
      label="Sub-merchant"
      placeholder="Tất cả sub-merchant"
      value={allowAll && !value ? ALL : value}
      onValueChange={(next) => {
        const picked = firstValue(next);
        onChange(picked === ALL ? "" : picked);
      }}
      options={options}
    />
  );
}
