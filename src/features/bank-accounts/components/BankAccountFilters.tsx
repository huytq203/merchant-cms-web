"use client";

import { useState } from "react";
import { FilterCard } from "@/components/page/FilterCard";
import { Select } from "@/components/ui/select/Select";
import { SubMerchantMultiFilter } from "@/features/sub-merchants/components/SubMerchantMultiFilter";
import type { BankAccountFilter } from "../types";

/**
 * SRS v2 (18/11/2026): lọc theo trạng thái gán (TK có Sub nào dùng chưa) và trạng thái TK; bỏ lọc liên kết/sử dụng cũ.
 * Lọc theo Sub trả các TK đang gán cho các Sub đó. Để trống = Tất cả.
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

  const search = () => {
    onSearch({
      ...(assignmentStatus ? { assignmentStatus: assignmentStatus as Values["assignmentStatus"] } : {}),
      ...(accountStatus ? { accountStatus: accountStatus as Values["accountStatus"] } : {}),
      ...(subMerchantIds.length > 0 ? { subMerchantIds } : {}),
      // Ô tìm chưa có trên màn: giữ nguyên `query` đến từ link để bấm Tìm kiếm không làm mất nó.
      ...(initial.query ? { query: initial.query } : {}),
    });
  };
  const clear = () => {
    setAssignmentStatus("");
    setAccountStatus("");
    setSubMerchantIds([]);
    onSearch({});
  };

  return (
    <FilterCard fieldCount={3} onSubmit={search} onClear={clear}>
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
