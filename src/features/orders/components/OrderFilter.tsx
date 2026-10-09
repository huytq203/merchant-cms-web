"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
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
const toDate = (value: string) => (value ? parseISO(value) : undefined);
const toDay = (value: Date | undefined) => (value ? format(value, "yyyy-MM-dd") : "");

export function OrderFilter({ initial, onSearch }: Props) {
  const [orderCode, setOrderCode] = useState(initial.orderCode ?? "");
  const [status, setStatus] = useState<string>(initial.status ?? "");
  const [subMerchantId, setSubMerchantId] = useState(initial.subMerchantId ?? "");
  const [createdFrom, setCreatedFrom] = useState(initial.createdFrom ?? "");
  const [createdTo, setCreatedTo] = useState(initial.createdTo ?? "");
  const [error, setError] = useState<string>();
  const subMerchants = useSubMerchantOptions();

  const submit = () => {
    if (createdFrom && createdTo && createdFrom > createdTo) {
      setError("Từ ngày phải trước hoặc bằng đến ngày");
      return;
    }
    setError(undefined);
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
    setError(undefined);
    onSearch({});
  };

  return (
    <FilterCard fieldCount={5} onSubmit={submit} onClear={clear}>
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
        label="Từ ngày"
        value={toDate(createdFrom)}
        onChange={(value) => setCreatedFrom(toDay(value instanceof Date ? value : undefined))}
        placeholder="Chọn ngày"
        presets={false}
      />
      <DatePicker
        label="Đến ngày"
        value={toDate(createdTo)}
        onChange={(value) => setCreatedTo(toDay(value instanceof Date ? value : undefined))}
        placeholder="Chọn ngày"
        presets={false}
        error={error}
      />
    </FilterCard>
  );
}
