"use client";

import { useState } from "react";
import { FilterCard } from "@/components/page/FilterCard";
import { Select } from "@/components/ui/select/Select";
import { REFUND_STATUS_OPTIONS } from "../constants/refund-status";
import { refundStatusSchema } from "../schemas";
import type { RefundFilter } from "../types";

interface Props {
  initial: RefundFilter;
  onSearch: (filter: RefundFilter) => void;
}

/** Status is the only free filter; an order filter arrives from the order screen and is kept as it is. */
export function RevenueRefundFilter({ initial, onSearch }: Props) {
  const [status, setStatus] = useState<string>(initial.status ?? "");
  const parsed = refundStatusSchema.safeParse(status);

  return (
    <FilterCard
      fieldCount={1}
      onSubmit={() => onSearch({ ...(parsed.success ? { status: parsed.data } : {}), ...(initial.orderId ? { orderId: initial.orderId } : {}) })}
      onClear={() => {
        setStatus("");
        onSearch({});
      }}
    >
      <Select label="Trạng thái" placeholder="Tất cả trạng thái" options={REFUND_STATUS_OPTIONS} value={status} onChange={setStatus} />
    </FilterCard>
  );
}
