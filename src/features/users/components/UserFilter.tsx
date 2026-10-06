"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { userStatusOptions } from "../constants/user.constants";
import type { UserFilter as UserFilterValues } from "../user-queries";
import { merchantLabel } from "../utils/user-mapper";

interface Props {
  filter: UserFilterValues;
  merchantIds: string[];
  onSearch: (values: Pick<UserFilterValues, "query" | "status" | "merchantId">) => void;
}

export function UserFilter({ filter, merchantIds, onSearch }: Props) {
  const [query, setQuery] = useState(filter.query ?? "");
  const [status, setStatus] = useState(filter.status ?? "");
  const [merchantId, setMerchantId] = useState(filter.merchantId ?? "");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch({
      ...(query.trim() ? { query: query.trim() } : {}),
      ...(status ? { status: status as UserFilterValues["status"] } : {}),
      ...(merchantId ? { merchantId } : {}),
    });
  };
  const clear = () => {
    setQuery("");
    setStatus("");
    setMerchantId("");
    onSearch({});
  };
  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-background p-4" aria-label="Bộ lọc người dùng">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input
          label="Tên hoặc email"
          placeholder="Nhập tên hoặc email cần tìm"
          value={query}
          maxLength={100}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          label="Trạng thái"
          placeholder="Chọn trạng thái"
          value={status}
          onChange={setStatus}
          clearable={false}
          options={[{ value: "", label: "Tất cả trạng thái" }, ...userStatusOptions]}
        />
        {merchantIds.length > 1 && (
          <Select
            label="Merchant"
            placeholder="Chọn merchant"
            value={merchantId}
            onChange={setMerchantId}
            clearable={false}
            options={[
              { value: "", label: "Merchant mặc định" },
              ...merchantIds.map((id) => ({ value: id, label: merchantLabel(merchantIds, id) })),
            ]}
          />
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={clear}>Xoá lọc</Button>
        <Button type="submit" variant="solid">Tìm kiếm</Button>
      </div>
    </form>
  );
}
