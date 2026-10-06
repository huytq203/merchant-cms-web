"use client";

import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { terminalStatusOptions } from "../constants/terminal.constants";
import { useTerminalFilterForm, type TerminalFilterValues } from "../hooks/use-terminal-filter-form";

type Props = { initial: TerminalFilterValues; onSearch: (values: TerminalFilterValues) => void };

export function TerminalFilters({ initial, onSearch }: Props) {
  const form = useTerminalFilterForm(initial, onSearch);
  const subMerchants = useSubMerchantOptions();
  const options = (subMerchants.data ?? []).map((item) => ({
    value: item.id,
    label: `${item.code} — ${item.name}`,
  }));

  return (
    <form onSubmit={form.submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Tên Terminal"
          placeholder="Nhập tên Terminal cần tìm"
          value={form.name}
          onChange={(event) => form.setName(event.target.value)}
        />
        <Select
          label="Sub-merchant"
          value={form.subMerchantId}
          onChange={form.setSubMerchantId}
          options={options}
          placeholder="Tất cả Sub-merchant"
        />
        <Select
          label="Trạng thái"
          value={form.status}
          onChange={form.setStatus}
          options={terminalStatusOptions}
          placeholder="Tất cả trạng thái"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={form.clear}>Xóa lọc</Button>
        <Button type="submit" variant="solid">Tìm kiếm</Button>
      </div>
    </form>
  );
}
