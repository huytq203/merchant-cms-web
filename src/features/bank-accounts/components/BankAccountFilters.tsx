"use client";

import { useState } from "react";
import { FilterCard } from "@/components/page/FilterCard";
import { Select } from "@/components/ui/select/Select";
import { SubMerchantMultiFilter } from "@/features/sub-merchants/components/SubMerchantMultiFilter";
import type { BankAccountFilter } from "../types";

/** Lọc theo một hoặc nhiều Sub (12/11/2026): BE trả TK của các Sub đó; TK cấp Master không thuộc Sub nào nên không hiện. */
type Values = Pick<BankAccountFilter, "linkStatus" | "status" | "subMerchantIds">;
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
  const [subMerchantIds, setSubMerchantIds] = useState<string[]>(initial.subMerchantIds ?? []);

  const search = () => {
    onSearch({
      ...(linkStatus ? { linkStatus: linkStatus as Values["linkStatus"] } : {}),
      ...(status ? { status: status as Values["status"] } : {}),
      ...(subMerchantIds.length > 0 ? { subMerchantIds } : {}),
    });
  };
  const clear = () => {
    setLinkStatus("");
    setStatus("");
    setSubMerchantIds([]);
    onSearch({});
  };

  return (
    <FilterCard fieldCount={3} onSubmit={search} onClear={clear}>
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
        <SubMerchantMultiFilter value={subMerchantIds} onChange={setSubMerchantIds} />
    </FilterCard>
  );
}
