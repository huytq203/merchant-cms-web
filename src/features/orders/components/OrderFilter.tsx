"use client";

import { useState } from "react";
import { FilterCard } from "@/components/page/FilterCard";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { orderStatusSchema } from "../schemas/order.schema";
import { ORDER_STATUS_OPTIONS } from "../constants/Order.constants";
import type { OrderListFilter } from "../types/types";

type Values = Pick<OrderListFilter, "orderCode" | "status">;
type Props = { initial: Values; onSearch: (values: Values) => void };

const statusOptions = ORDER_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }));

export function OrderFilter({ initial, onSearch }: Props) {
  const [orderCode, setOrderCode] = useState(initial.orderCode ?? "");
  const [status, setStatus] = useState<string>(initial.status ?? "");

  const submit = () => {
    const parsedStatus = orderStatusSchema.safeParse(status);
    onSearch({
      ...(orderCode.trim() ? { orderCode: orderCode.trim() } : {}),
      ...(parsedStatus.success ? { status: parsedStatus.data } : {}),
    });
  };
  const clear = () => {
    setOrderCode("");
    setStatus("");
    onSearch({});
  };

  return (
    <FilterCard fieldCount={2} onSubmit={submit} onClear={clear}>
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
    </FilterCard>
  );
}
