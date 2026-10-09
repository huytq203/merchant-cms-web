"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { FilterCard } from "@/components/page/FilterCard";
import { DatePicker } from "@/components/ui/datepicker/DatePicker";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { orderStatusSchema } from "../schemas/order.schema";
import { ORDER_STATUS_OPTIONS } from "../constants/Order.constants";
import type { OrderFilterValues } from "../types/types";

type Props = { initial: OrderFilterValues; onSearch: (values: OrderFilterValues) => void };

const statusOptions = ORDER_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }));
const toDay = (value: Date | undefined) => (value ? format(value, "yyyy-MM-dd") : "");

export function OrderFilter({ initial, onSearch }: Props) {
  const [orderCode, setOrderCode] = useState(initial.orderCode ?? "");
  const [status, setStatus] = useState<string>(initial.status ?? "");
  const [subMerchantId, setSubMerchantId] = useState(initial.subMerchantId ?? "");
  const [createdFrom, setCreatedFrom] = useState(initial.createdFrom ?? "");
  const [createdTo, setCreatedTo] = useState(initial.createdTo ?? "");
  const subMerchants = useSubMerchantOptions();

  const submit = () => {
    const parsedStatus = orderStatusSchema.safeParse(status);
    onSearch({
      ...(orderCode.trim() ? { orderCode: orderCode.trim() } : {}),
      ...(parsedStatus.success ? { status: parsedStatus.data } : {}),
      ...(subMerchantId ? { subMerchantId } : {}),
      ...(createdFrom ? { createdFrom } : {}),
      ...(createdTo ? { createdTo } : {}),
    });
  };
  const clear = () => {
    setOrderCode("");
    setStatus("");
    setSubMerchantId("");
    setCreatedFrom("");
    setCreatedTo("");
    onSearch({});
  };

  return (
    <FilterCard fieldCount={4} onSubmit={submit} onClear={clear}>
      <Input
        label="Mã đơn hàng"
        placeholder="Nhập mã đơn hàng cần tìm"
        value={orderCode}
        maxLength={100}
        onChange={(event) => setOrderCode(event.target.value)}
      />
      <Select
        label="Trạng thái"
        value={status}
        onChange={setStatus}
        options={statusOptions}
        placeholder="Tất cả trạng thái"
      />
      <Select
        label="Sub-merchant"
        value={subMerchantId}
        onChange={setSubMerchantId}
        options={(subMerchants.data ?? []).map((sub) => ({ value: sub.id, label: `${sub.code} — ${sub.name}` }))}
        placeholder="Tất cả Sub-merchant"
      />
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
