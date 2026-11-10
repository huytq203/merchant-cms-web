"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { FilterCard } from "@/components/page/FilterCard";
import { DatePicker } from "@/components/ui/datepicker/DatePicker";
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

const bankAccountOptions = [
  { value: "", label: "Tất cả" },
  { value: "true", label: "Đã có TK nhận tiền" },
  { value: "false", label: "Chưa có TK nhận tiền" },
];

const toDay = (value: Date | undefined) => (value ? format(value, "yyyy-MM-dd") : "");
const toChoice = (value: boolean | undefined) => (value === undefined ? "" : String(value));

export function SubMerchantFilters({ onSearch, defaultValues }: Props) {
  const [code, setCode] = useState(defaultValues?.code ?? "");
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [status, setStatus] = useState<string>(defaultValues?.status ?? "");
  const [hasBankAccount, setHasBankAccount] = useState(toChoice(defaultValues?.hasBankAccount));
  const [createdFrom, setCreatedFrom] = useState(defaultValues?.createdFrom ?? "");
  const [createdTo, setCreatedTo] = useState(defaultValues?.createdTo ?? "");

  const submit = () => {
    onSearch({
      ...(code.trim() ? { code: code.trim() } : {}),
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(status ? { status: status as SubMerchantFilterValues["status"] } : {}),
      ...(hasBankAccount ? { hasBankAccount: hasBankAccount === "true" } : {}),
      ...(createdFrom ? { createdFrom } : {}),
      ...(createdTo ? { createdTo } : {}),
    });
  };
  const clear = () => {
    setCode("");
    setName("");
    setStatus("");
    setHasBankAccount("");
    setCreatedFrom("");
    setCreatedTo("");
    onSearch({});
  };

  return (
    <FilterCard fieldCount={6} onSubmit={submit} onClear={clear}>
      <Input label="Mã Sub-merchant" placeholder="Nhập mã cần tìm" value={code} maxLength={100} onChange={(event) => setCode(event.target.value)} />
      <Input label="Tên Sub-merchant" placeholder="Nhập tên cần tìm" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} />
      <Select label="Trạng thái" placeholder="Tất cả trạng thái" value={status} onChange={setStatus} clearable={false} options={statusOptions} />
      <Select label="TK nhận tiền" placeholder="Tất cả" value={hasBankAccount} onChange={setHasBankAccount} clearable={false} options={bankAccountOptions} />
      <DatePicker
        mode="range"
        label="Ngày tạo"
        value={createdFrom ? { from: parseISO(createdFrom), to: createdTo ? parseISO(createdTo) : undefined } : undefined}
        onChange={(value) => {
          const range = value && !(value instanceof Date) ? (value as DateRange) : undefined;
          setCreatedFrom(toDay(range?.from));
          setCreatedTo(toDay(range?.to));
        }}
        placeholder="Từ ngày, đến ngày"
      />
    </FilterCard>
  );
}
