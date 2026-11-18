"use client";

import { useState } from "react";
import { FilterCard } from "@/components/page/FilterCard";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { SubMerchantMultiFilter } from "@/features/sub-merchants/components/SubMerchantMultiFilter";
import type { BankAccountFilter } from "../types";

/**
 * SRS v2 (18/11/2026): lọc theo trạng thái gán (TK có Sub nào dùng chưa) và trạng thái TK; bỏ lọc liên kết/sử dụng cũ.
 * Lọc theo Sub trả các TK đang gán cho các Sub đó. Ô tìm kiếm gửi `query` (BE tìm theo tên chủ TK, số TK, ngân hàng).
 * Để trống = Tất cả.
 */
type Values = Pick<BankAccountFilter, "assignmentStatus" | "accountStatus" | "subMerchantIds" | "query">;
type Props = { initial: Values; onSearch: (values: Values) => void };

const assignmentOptions = [
  { value: "ASSIGNED", label: "Đã gán" },
  { value: "UNASSIGNED", label: "Chưa gán" },
];
const accountStatusOptions = [
  { value: "PENDING_VERIFICATION", label: "Chờ xác minh" },
  { value: "VERIFIED", label: "Đã xác minh" },
  { value: "LOCKED", label: "Khóa" },
];

export function BankAccountFilters({ initial, onSearch }: Props) {
  const [assignmentStatus, setAssignmentStatus] = useState(initial.assignmentStatus ?? "");
  const [accountStatus, setAccountStatus] = useState(initial.accountStatus ?? "");
  const [subMerchantIds, setSubMerchantIds] = useState<string[]>(initial.subMerchantIds ?? []);
  const [query, setQuery] = useState(initial.query ?? "");

  const search = () => {
    onSearch({
      ...(assignmentStatus ? { assignmentStatus: assignmentStatus as Values["assignmentStatus"] } : {}),
      ...(accountStatus ? { accountStatus: accountStatus as Values["accountStatus"] } : {}),
      ...(subMerchantIds.length > 0 ? { subMerchantIds } : {}),
      ...(query.trim() ? { query: query.trim() } : {}),
    });
  };
  const clear = () => {
    setAssignmentStatus("");
    setAccountStatus("");
    setSubMerchantIds([]);
    setQuery("");
    onSearch({});
  };

  return (
    <FilterCard fieldCount={4} onSubmit={search} onClear={clear}>
      <Input
        label="Tìm kiếm"
        placeholder="Số tài khoản, chủ tài khoản, ngân hàng"
        value={query}
        maxLength={100}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Select
        label="Trạng thái gán"
        placeholder="Tất cả"
        value={assignmentStatus}
        options={assignmentOptions}
        onChange={setAssignmentStatus}
      />
      <Select
        label="Trạng thái tài khoản"
        placeholder="Tất cả trạng thái"
        value={accountStatus}
        options={accountStatusOptions}
        onChange={setAccountStatus}
      />
      <SubMerchantMultiFilter value={subMerchantIds} onChange={setSubMerchantIds} />
    </FilterCard>
  );
}
