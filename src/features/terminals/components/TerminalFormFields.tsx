"use client";

import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { terminalTypeOptions } from "../constants/terminal.constants";
import type { ChangeTerminalField } from "../hooks/use-terminal-form";
import type { TerminalFormValues } from "../schemas";
import type { TerminalDetail } from "../types";

type Props = {
  values: TerminalFormValues;
  change: ChangeTerminalField;
  detail?: TerminalDetail | null;
};

export function TerminalIdentityFields({ values, change, detail }: Props) {
  const subMerchants = useSubMerchantOptions();
  const options = subMerchants.data?.map((item) => ({
    value: item.id,
    label: `${item.code} — ${item.name}`,
  })) ?? [];

  return (
    <>
      <Select
        label="Sub-merchant"
        placeholder="Chọn sub-merchant"
        value={values.subMerchantId}
        disabled={Boolean(detail)}
        onChange={(value) => change("subMerchantId", value)}
        options={options}
      />
      <Input
        label="Tên Terminal"
        placeholder="Ví dụ: Quầy thu ngân 01"
        required
        value={values.name}
        onChange={(event) => change("name", event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Loại Terminal"
          placeholder="Chọn loại Terminal"
          value={values.terminalType}
          onChange={(value) => change("terminalType", value as TerminalFormValues["terminalType"])}
          options={terminalTypeOptions}
        />
        <Input label="Mã Terminal" value={detail?.tid ?? "Tự sinh"} disabled />
      </div>
      {detail && values.terminalType !== detail.terminalType && (
        <p className="text-sm text-warning">
          Đổi loại Terminal có thể ảnh hưởng thiết bị đã gắn.
        </p>
      )}
      {values.terminalType === "POS" && (
        <Input
          label="Địa chỉ điểm bán"
          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
          required
          value={values.address}
          onChange={(event) => change("address", event.target.value)}
        />
      )}
    </>
  );
}

export function TerminalContactFields({ values, change }: Omit<Props, "detail">) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Người liên hệ"
          placeholder="Ví dụ: Nguyễn Văn A"
          value={values.contactPerson}
          onChange={(event) => change("contactPerson", event.target.value)}
        />
        <Input
          label="Số điện thoại"
          placeholder="Ví dụ: 0912345678"
          value={values.contactPhone}
          disabled={values.inheritContactPhone}
          onChange={(event) => change("contactPhone", event.target.value)}
        />
      </div>
      <Checkbox
        checked={values.inheritContactPhone}
        onCheckedChange={(checked) => change("inheritContactPhone", checked === true)}
        label="Kế thừa số điện thoại"
      />
      <Input
        label="Ghi chú"
        placeholder="Thông tin bổ sung về Terminal (nếu có)"
        value={values.note}
        onChange={(event) => change("note", event.target.value)}
      />
    </>
  );
}
