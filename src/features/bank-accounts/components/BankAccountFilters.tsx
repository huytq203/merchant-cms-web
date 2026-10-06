"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button/Button";
import { Select } from "@/components/ui/select/Select";
import type { BankAccountFilter } from "../types";

type Values = Pick<BankAccountFilter, "linkStatus" | "status">;
type Props = { initial: Values; onSearch: (values: Values) => void };

const linkOptions = [
  { value: "LINKED", label: "Đã liên kết" },
  { value: "PENDING_VERIFICATION", label: "Chờ xác minh" },
  { value: "LINK_FAILED", label: "Liên kết thất bại" },
];
const usageOptions = [
  { value: "ACTIVE", label: "Đang dùng" },
  { value: "INACTIVE", label: "Ngừng sử dụng" },
];

export function BankAccountFilters({ initial, onSearch }: Props) {
  const [linkStatus, setLinkStatus] = useState(initial.linkStatus ?? "");
  const [status, setStatus] = useState(initial.status ?? "");

  const search = (event: FormEvent) => {
    event.preventDefault();
    onSearch({
      ...(linkStatus ? { linkStatus: linkStatus as Values["linkStatus"] } : {}),
      ...(status ? { status: status as Values["status"] } : {}),
    });
  };
  const clear = () => {
    setLinkStatus("");
    setStatus("");
    onSearch({});
  };

  return (
    <form onSubmit={search} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Trạng thái liên kết"
          placeholder="Tất cả trạng thái"
          value={linkStatus}
          options={linkOptions}
          onChange={setLinkStatus}
        />
        <Select
          label="Trạng thái sử dụng"
          placeholder="Tất cả trạng thái"
          value={status}
          options={usageOptions}
          onChange={setStatus}
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
