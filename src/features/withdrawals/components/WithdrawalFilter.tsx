"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { WITHDRAWAL_STATUS_OPTIONS } from "../constants/Withdrawal.constants";
import { withdrawalStatusSchema } from "../schemas/withdrawal.schema";
import type { WithdrawalStatus } from "../types/types";

/** Not rendered while the BE search has no filter; kept to reuse once it does. */
type Values = {
  transactionCode?: string;
  status?: WithdrawalStatus;
  /** Calendar day, `yyyy-MM-dd`. */
  createdFrom?: string;
  createdTo?: string;
};
type Props = { initial: Values; onSearch: (values: Values) => void };

const statusOptions = WITHDRAWAL_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }));
const RANGE_ERROR = "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc";

export function WithdrawalFilter({ initial, onSearch }: Props) {
  const [transactionCode, setTransactionCode] = useState(initial.transactionCode ?? "");
  const [status, setStatus] = useState<string>(initial.status ?? "");
  const [createdFrom, setCreatedFrom] = useState(initial.createdFrom ?? "");
  const [createdTo, setCreatedTo] = useState(initial.createdTo ?? "");
  const reversed = Boolean(createdFrom && createdTo && createdFrom > createdTo);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (reversed) return;
    const parsedStatus = withdrawalStatusSchema.safeParse(status);
    onSearch({
      ...(transactionCode.trim() ? { transactionCode: transactionCode.trim() } : {}),
      ...(parsedStatus.success ? { status: parsedStatus.data } : {}),
      ...(createdFrom ? { createdFrom } : {}),
      ...(createdTo ? { createdTo } : {}),
    });
  };
  const clear = () => {
    setTransactionCode("");
    setStatus("");
    setCreatedFrom("");
    setCreatedTo("");
    onSearch({});
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Input
          label="Mã giao dịch"
          placeholder="Nhập mã giao dịch cần tìm"
          value={transactionCode}
          maxLength={100}
          onChange={(event) => setTransactionCode(event.target.value)}
        />
        <Select
          label="Trạng thái"
          value={status}
          onChange={setStatus}
          options={statusOptions}
          placeholder="Tất cả trạng thái"
        />
        <Input
          label="Từ ngày"
          type="date"
          value={createdFrom}
          onChange={(event) => setCreatedFrom(event.target.value)}
        />
        <Input
          label="Đến ngày"
          type="date"
          value={createdTo}
          error={reversed ? RANGE_ERROR : undefined}
          onChange={(event) => setCreatedTo(event.target.value)}
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
