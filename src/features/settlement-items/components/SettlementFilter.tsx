"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { FilterCard } from "@/components/page/FilterCard";
import { DatePicker } from "@/components/ui/datepicker/DatePicker";
import { Select } from "@/components/ui/select/Select";
import type { SubMerchantChoice } from "@/features/sub-merchants/utils/sub-merchant-choice";
import type { ResolvedSettlementFilter } from "../types";

type Range = Pick<ResolvedSettlementFilter, "subMerchantId" | "paidFrom" | "paidTo">;

interface Props {
  initial: Range;
  choices: SubMerchantChoice[];
  onSearch: (range: Range) => void;
  onClear: () => void;
}

const toDay = (value: Date | undefined) => (value ? format(value, "yyyy-MM-dd") : "");

/** Sub and both dates are required by the BE; the search stays disabled until all three are set. */
export function SettlementFilter({ initial, choices, onSearch, onClear }: Props) {
  const [subMerchantId, setSubMerchantId] = useState(initial.subMerchantId);
  const [paidFrom, setPaidFrom] = useState(initial.paidFrom);
  const [paidTo, setPaidTo] = useState(initial.paidTo);

  const submit = () => {
    if (subMerchantId && paidFrom && paidTo) onSearch({ subMerchantId, paidFrom, paidTo });
  };

  return (
    <FilterCard fieldCount={2} onSubmit={submit} onClear={onClear}>
      <Select
        label="Sub-merchant"
        placeholder="Chọn Sub-merchant"
        options={choices.map((choice) => ({ label: choice.label, value: choice.id }))}
        value={subMerchantId}
        onChange={(value) => value && setSubMerchantId(value)}
        clearable={false}
      />
      <DatePicker
        mode="range"
        label="Ngày thanh toán"
        placeholder="Từ ngày, đến ngày"
        value={paidFrom ? { from: parseISO(paidFrom), to: paidTo ? parseISO(paidTo) : undefined } : undefined}
        onChange={(value) => {
          const range = value && !(value instanceof Date) ? (value as DateRange) : undefined;
          setPaidFrom(toDay(range?.from));
          setPaidTo(toDay(range?.to));
        }}
      />
    </FilterCard>
  );
}
