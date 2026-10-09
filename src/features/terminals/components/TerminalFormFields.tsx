"use client";

import { Lock } from "lucide-react";
import { InheritableField } from "@/components/form/InheritableField";
import { SegmentedControl } from "@/components/form/SegmentedControl";
import { DetailSection } from "@/components/modal/DetailModal";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { terminalTypeOptions } from "../constants/terminal.constants";
import type { ChangeTerminalField, TerminalFormErrors } from "../hooks/use-terminal-form";
import type { TerminalFormValues } from "../schemas";
import type { TerminalDetail } from "../types";

type Props = {
  values: TerminalFormValues;
  errors: TerminalFormErrors;
  change: ChangeTerminalField;
  detail?: TerminalDetail | null;
};

function SubMerchantField({ values, errors, change, detail }: Props) {
  const subMerchants = useSubMerchantOptions();
  const options = subMerchants.data?.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })) ?? [];

  if (detail) {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor="terminal-sub-merchant" className="text-sm font-medium text-foreground">Sub-merchant</label>
        <Input
          id="terminal-sub-merchant"
          readOnly
          placeholder="Chưa có Sub-merchant"
          icon={<Lock className="h-4 w-4" aria-hidden="true" />}
          value={[detail.subMerchantCode, detail.subMerchantName].filter(Boolean).join(" - ")}
          className="border-divider bg-accent font-medium"
        />
        <p className="text-xs text-muted-foreground">Không đổi được Sub-merchant của Terminal đã tạo.</p>
      </div>
    );
  }
  return (
    <Select
      label="Sub-merchant"
      placeholder="Chọn Sub-merchant"
      value={values.subMerchantId}
      onChange={(value) => change("subMerchantId", value)}
      options={options}
      clearable={false}
      error={errors.subMerchantId}
    />
  );
}

export function TerminalIdentityFields({ values, errors, change, detail }: Props) {
  const typeChanged = Boolean(detail) && values.terminalType !== detail?.terminalType;

  return (
    <DetailSection title="Thông tin chung" bare>
      <div className="flex flex-col gap-4">
        <SubMerchantField values={values} errors={errors} change={change} detail={detail} />
        <Input
          label="Tên Terminal"
          placeholder="Ví dụ: Quầy thu ngân 01"
          required
          value={values.name}
          error={errors.name}
          onChange={(event) => change("name", event.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <span id="terminal-type-label" className="text-sm font-medium text-foreground">Loại Terminal</span>
          <SegmentedControl
            ariaLabel="Loại Terminal"
            fullWidth
            value={values.terminalType}
            onChange={(value) => change("terminalType", value)}
            options={terminalTypeOptions}
          />
          {typeChanged && (
            <p role="note" className="rounded-lg bg-warning-soft px-3 py-1.5 text-xs font-medium text-warning">
              Đổi loại Terminal có thể ảnh hưởng thiết bị đã gắn.
            </p>
          )}
        </div>
        {values.terminalType === "POS" && (
          <Input
            label="Địa chỉ đặt máy POS"
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
            required
            value={values.address}
            error={errors.address}
            onChange={(event) => change("address", event.target.value)}
          />
        )}
      </div>
    </DetailSection>
  );
}

export function TerminalContactFields({ values, errors, change }: Omit<Props, "detail">) {
  return (
    <DetailSection title="Liên hệ" bare>
      <div className="flex flex-col gap-5">
        <Input
          label="Người liên hệ"
          placeholder="Ví dụ: Nguyễn Văn An"
          value={values.contactPerson}
          onChange={(event) => change("contactPerson", event.target.value)}
        />
        <InheritableField
          label="Số điện thoại"
          sourceName="Sub-merchant"
          inherited={values.inheritContactPhone}
          onInheritedChange={(next) => change("inheritContactPhone", next)}
        >
          {(id) => (
            <Input
              id={id}
              placeholder="Ví dụ: 0912345678"
              value={values.contactPhone}
              error={errors.contactPhone}
              onChange={(event) => change("contactPhone", event.target.value)}
            />
          )}
        </InheritableField>
        <Textarea
          label="Ghi chú"
          placeholder="Thông tin bổ sung về Terminal (nếu có)"
          rows={2}
          maxLength={500}
          value={values.note}
          onChange={(event) => change("note", event.target.value)}
        />
      </div>
    </DetailSection>
  );
}
