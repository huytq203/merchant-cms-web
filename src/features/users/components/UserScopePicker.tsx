"use client";

import { Store } from "lucide-react";
import { DetailSection } from "@/components/modal/DetailModal";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Radio } from "@/components/ui/radio/Radio";
import { RadioGroup } from "@/components/ui/radio-group/RadioGroup";
import { Select } from "@/components/ui/select/Select";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import type { ScopeMode, UserForm } from "../hooks/use-user-form";

interface Props {
  form: UserForm;
  /** Omitted when the merchant has no name to show: a made-up "Merchant 1" would name nothing. */
  merchantName?: string;
  /** Merchants to choose from; a select is shown only when there is more than one. */
  merchantOptions?: { value: string; label: string }[];
}

function SubMerchantList({ form }: { form: UserForm }) {
  const options = useSubMerchantOptions(form.values.merchantId);
  const picked = form.values.subMerchantIds;
  const error = form.issues.subMerchantIds;

  if (options.isPending) return <p role="status" className="text-sm text-muted-foreground">Đang tải sub-merchant</p>;
  if (options.isError) return <p role="alert" className="text-sm text-danger">Không tải được sub-merchant</p>;
  return (
    <div className="space-y-2">
      <fieldset aria-label="Sub-merchant" className="grid max-h-44 gap-1.5 overflow-y-auto rounded-xl border border-border p-2">
        {options.data.map((option) => (
          <Checkbox
            key={option.id}
            label={`${option.code} · ${option.name}`}
            checked={picked.includes(option.id)}
            onCheckedChange={(next) => form.toggle("subMerchantIds", option.id, next === true)}
          />
        ))}
      </fieldset>
      <p className="text-xs tabular-nums text-muted-foreground">
        Đã chọn {picked.length}/{options.data.length} sub-merchant
      </p>
      {error ? <p role="alert" className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}

export function UserScopePicker({ form, merchantName, merchantOptions }: Props) {
  return (
    <DetailSection title="Phạm vi truy cập" icon={<Store className="h-4 w-4" />} bare>
      {merchantOptions && merchantOptions.length > 1 ? (
        <Select
          label="Merchant"
          placeholder="Chọn merchant"
          value={form.values.merchantId}
          onChange={form.setMerchantId}
          clearable={false}
          options={merchantOptions}
        />
      ) : null}
      {merchantName ? (
        <p className="text-sm text-muted-foreground">Merchant: <span className="font-medium text-foreground">{merchantName}</span></p>
      ) : null}
      <RadioGroup
        aria-label="Phạm vi sub-merchant"
        orientation="horizontal"
        value={form.values.scope}
        onValueChange={(value) => form.setScope(value as ScopeMode)}
      >
        <Radio value="all" label="Toàn bộ sub-merchant" />
        <Radio value="selected" label="Chọn sub-merchant" />
      </RadioGroup>
      {form.values.scope === "selected" ? <SubMerchantList form={form} /> : null}
    </DetailSection>
  );
}
