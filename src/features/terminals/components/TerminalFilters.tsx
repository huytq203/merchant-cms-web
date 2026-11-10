"use client";

import { FilterCard } from "@/components/page/FilterCard";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { terminalStatusOptions, terminalTypeOptions } from "../constants/terminal.constants";
import { useTerminalFilterForm, type TerminalFilterValues } from "../hooks/use-terminal-filter-form";

type Props = { initial: TerminalFilterValues; onSearch: (values: TerminalFilterValues) => void };

export function TerminalFilters({ initial, onSearch }: Props) {
  const form = useTerminalFilterForm(initial, onSearch);
  const subMerchants = useSubMerchantOptions();
  const options = (subMerchants.data ?? []).map((item) => ({
    value: item.id,
    label: `${item.code} - ${item.name}`,
  }));

  return (
    <FilterCard fieldCount={4} onSubmit={form.submit} onClear={form.clear}>
        <Input
          label="Tên Terminal"
          placeholder="Nhập tên Terminal cần tìm"
          value={form.name}
          onChange={(event) => form.setName(event.target.value)}
        />
        <Select
          label="Loại terminal"
          value={form.terminalType}
          onChange={form.setTerminalType}
          options={terminalTypeOptions}
          placeholder="Tất cả loại"
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
    </FilterCard>
  );
}
