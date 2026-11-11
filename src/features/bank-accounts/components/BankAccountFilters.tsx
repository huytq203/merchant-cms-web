"use client";

import { useState } from "react";
import { FilterCard } from "@/components/page/FilterCard";
import { Select } from "@/components/ui/select/Select";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import type { BankAccountFilter } from "../types";

/** Lọc theo Sub (11/11/2026): BE trả TK của đúng Sub đó; TK cấp Master không thuộc Sub nào nên không hiện. */
type Values = Pick<BankAccountFilter, "linkStatus" | "status" | "subMerchantId">;
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
  const [subMerchantId, setSubMerchantId] = useState(initial.subMerchantId ?? "");
  const subMerchants = useSubMerchantOptions();
  const subOptions = (subMerchants.data ?? []).map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }));

  const search = () => {
    onSearch({
      ...(linkStatus ? { linkStatus: linkStatus as Values["linkStatus"] } : {}),
      ...(status ? { status: status as Values["status"] } : {}),
      ...(subMerchantId ? { subMerchantId } : {}),
    });
  };
  const clear = () => {
    setLinkStatus("");
    setStatus("");
    setSubMerchantId("");
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
        <Select
          label="Sub-merchant"
          placeholder={subMerchants.isPending ? "Đang tải..." : "Tất cả Sub-merchant"}
          value={subMerchantId}
          options={subOptions}
          onChange={setSubMerchantId}
        />
    </FilterCard>
  );
}
