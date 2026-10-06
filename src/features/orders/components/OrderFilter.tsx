"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button/Button";
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

  const submit = (event: FormEvent) => {
    event.preventDefault();
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
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={clear}>
          Xóa lọc
        </Button>
        <Button type="submit" variant="solid">
          Tìm kiếm
        </Button>
      </div>
    </form>
  );
}
