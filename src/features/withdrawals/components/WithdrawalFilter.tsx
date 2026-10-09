"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { FilterCard } from "@/components/page/FilterCard";
import { DatePicker } from "@/components/ui/datepicker/DatePicker";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { withdrawalStatusGroupSchema } from "../schemas/withdrawal.schema";
import { WITHDRAWAL_STATUS_GROUPS } from "../constants/Withdrawal.constants";
import type { WithdrawalFilterValues } from "../types/types";

type Props = { initial: WithdrawalFilterValues; onSearch: (values: WithdrawalFilterValues) => void };

const groupOptions = WITHDRAWAL_STATUS_GROUPS.map(({ value, label }) => ({ value, label }));
const toDay = (value: Date | undefined) => (value ? format(value, "yyyy-MM-dd") : "");

export function WithdrawalFilter({ initial, onSearch }: Props) {
  const [transactionCode, setTransactionCode] = useState(initial.transactionCode ?? "");
  const [group, setGroup] = useState<string>(initial.statusGroup ?? "");
  const [createdFrom, setCreatedFrom] = useState(initial.createdFrom ?? "");
  const [createdTo, setCreatedTo] = useState(initial.createdTo ?? "");

  const submit = () => {
    const parsedGroup = withdrawalStatusGroupSchema.safeParse(group);
    onSearch({
      ...(transactionCode.trim() ? { transactionCode: transactionCode.trim() } : {}),
      ...(parsedGroup.success ? { statusGroup: parsedGroup.data } : {}),
      ...(createdFrom ? { createdFrom } : {}),
      ...(createdTo ? { createdTo } : {}),
    });
  };
  const clear = () => {
    setTransactionCode("");
    setGroup("");
    setCreatedFrom("");
    setCreatedTo("");
    onSearch({});
  };

  return (
    <FilterCard fieldCount={3} onSubmit={submit} onClear={clear}>
      <Input
        label="Mã giao dịch"
        placeholder="Nhập mã giao dịch cần tìm"
        value={transactionCode}
        maxLength={100}
        onChange={(event) => setTransactionCode(event.target.value)}
      />
      <Select label="Trạng thái" value={group} onChange={setGroup} options={groupOptions} placeholder="Tất cả trạng thái" />
      <DatePicker
        mode="range"
        label="Ngày yêu cầu"
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
