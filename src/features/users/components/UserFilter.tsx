"use client";

import { useState } from "react";
import { FilterCard } from "@/components/page/FilterCard";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { userStatusOptions } from "../constants/user.constants";
import { MASTER_SCOPE, type UserFilter as UserFilterValues } from "../user-queries";
import type { SessionMerchant } from "@/types/auth";
import { merchantOptionLabel } from "../utils/user-mapper";

interface Props {
  filter: UserFilterValues;
  merchantIds: string[];
  /** Code and name of those merchants; without them the options fall back to a position label. */
  merchants?: SessionMerchant[];
  /** Permission groups the caller may see (from the assignable-group list); empty hides nothing, the select just has no choices. */
  groupOptions?: { value: string; label: string }[];
  /** Sub-merchants of the session, for the "Phạm vi" choice next to "Master". */
  subMerchantOptions?: { value: string; label: string }[];
  onSearch: (values: Pick<UserFilterValues, "query" | "status" | "merchantId" | "permissionGroupId" | "scope">) => void;
}

export function UserFilter({ filter, merchantIds, merchants = [], groupOptions = [], subMerchantOptions = [], onSearch }: Props) {
  const [query, setQuery] = useState(filter.query ?? "");
  const [status, setStatus] = useState(filter.status ?? "");
  const [merchantId, setMerchantId] = useState(filter.merchantId ?? "");
  const [permissionGroupId, setPermissionGroupId] = useState(filter.permissionGroupId ?? "");
  const [scope, setScope] = useState(filter.scope ?? "");
  const submit = () => {
    onSearch({
      ...(query.trim() ? { query: query.trim() } : {}),
      ...(status ? { status: status as UserFilterValues["status"] } : {}),
      ...(merchantId ? { merchantId } : {}),
      ...(permissionGroupId ? { permissionGroupId } : {}),
      ...(scope ? { scope } : {}),
    });
  };
  const clear = () => {
    setQuery("");
    setStatus("");
    setMerchantId("");
    setPermissionGroupId("");
    setScope("");
    onSearch({});
  };
  return (
    <FilterCard fieldCount={merchantIds.length > 1 ? 5 : 4} onSubmit={submit} onClear={clear}>
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
        <Select
          label="Nhóm quyền"
          placeholder="Tất cả nhóm quyền"
          value={permissionGroupId}
          onChange={setPermissionGroupId}
          clearable={false}
          options={[{ value: "", label: "Tất cả nhóm quyền" }, ...groupOptions]}
        />
        <Select
          label="Phạm vi"
          placeholder="Tất cả (Master / từng Sub)"
          value={scope}
          onChange={setScope}
          clearable={false}
          options={[
            { value: "", label: "Tất cả (Master / từng Sub)" },
            { value: MASTER_SCOPE, label: "Master (toàn bộ)" },
            ...subMerchantOptions,
          ]}
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
              ...merchantIds.map((id) => ({ value: id, label: merchantOptionLabel(merchants, merchantIds, id) })),
            ]}
          />
        )}
    </FilterCard>
  );
}
