"use client";

import { useState } from "react";
import { FilterCard } from "@/components/page/FilterCard";
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
  const submit = () => {
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
    <FilterCard fieldCount={merchantIds.length > 1 ? 3 : 2} onSubmit={submit} onClear={clear}>
        <Input
          label="Tên hoặc email"
          placeholder="Nhập tên hoặc email cần tìm"
          value={query}
          maxLength={100}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          label="Trạng thái"
          placeholder="Tất cả trạng thái"
          value={status}
          onChange={setStatus}
          clearable={false}
          options={[{ value: "", label: "Tất cả trạng thái" }, ...userStatusOptions]}
        />
        {merchantIds.length > 1 && (
          <Select
            label="Merchant"
            placeholder="Tất cả merchant"
            value={merchantId}
            onChange={setMerchantId}
            clearable={false}
            options={[
              { value: "", label: "Merchant mặc định" },
              ...merchantIds.map((id) => ({ value: id, label: merchantLabel(merchantIds, id) })),
            ]}
          />
        )}
    </FilterCard>
  );
}
