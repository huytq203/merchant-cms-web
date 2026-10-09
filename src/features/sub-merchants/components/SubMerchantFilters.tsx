"use client";

import { useState } from "react";
import { FilterCard } from "@/components/page/FilterCard";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import type { SubMerchantFilterValues } from "../schemas";

type Props = {
  onSearch: (values: SubMerchantFilterValues) => void;
  defaultValues?: SubMerchantFilterValues;
};

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "INACTIVE", label: "Đã khóa" },
  { value: "TERMINATED", label: "Đã đóng" },
];

export function SubMerchantFilters({ onSearch, defaultValues }: Props) {
  const [code, setCode] = useState(defaultValues?.code ?? "");
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [status, setStatus] = useState<string>(defaultValues?.status ?? "");

  const submit = () => {
    onSearch({
      ...(code.trim() ? { code: code.trim() } : {}),
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(status ? { status: status as SubMerchantFilterValues["status"] } : {}),
    });
  };
  const clear = () => {
    setCode("");
    setName("");
    setStatus("");
    onSearch({});
  };

  return (
    <FilterCard fieldCount={3} onSubmit={submit} onClear={clear}>
      <Input label="Mã Sub-merchant" placeholder="Nhập mã cần tìm" value={code} maxLength={100} onChange={(event) => setCode(event.target.value)} />
      <Input label="Tên Sub-merchant" placeholder="Nhập tên cần tìm" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} />
      <Select label="Trạng thái" placeholder="Tất cả trạng thái" value={status} onChange={setStatus} clearable={false} options={statusOptions} />
    </FilterCard>
  );
}
