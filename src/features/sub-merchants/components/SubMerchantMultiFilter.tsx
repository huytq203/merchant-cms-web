"use client";

import { useMemo } from "react";
import { useOptionalSession } from "@/features/auth/components/session-provider";
import { useSubMerchantOptions } from "../hooks/use-sub-merchant-options";
import { SubMerchantMultiSelect } from "./SubMerchantMultiSelect";

interface Props {
  /** Id các Sub đang lọc; rỗng = tất cả. */
  value: readonly string[];
  onChange: (ids: string[]) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Ô lọc "Sub-merchant" cho form bộ lọc: nguồn Sub là danh sách nhẹ `/sub-merchants/choices`, Master lấy từ session.
 * Người dùng thuộc từ 2 Master trở lên được thêm bước chọn Merchant (ô đổi tên "Merchant / Sub-merchant").
 */
export function SubMerchantMultiFilter({ value, onChange, label, disabled }: Props) {
  const session = useOptionalSession();
  const choices = useSubMerchantOptions();

  const merchants = useMemo(
    () =>
      (session?.merchantIds ?? []).map((id, index) => {
        const merchant = session?.merchants.find((candidate) => candidate.id === id);
        // BE cũ không gửi tên Master: rơi về nhãn theo thứ tự để người dùng vẫn phân biệt được.
        const name = merchant?.name ?? `Merchant ${index + 1}`;
        return { id, label: merchant?.code ? `${merchant.code} · ${name}` : name };
      }),
    [session],
  );

  return (
    <SubMerchantMultiSelect
      options={choices.data ?? []}
      value={value}
      onChange={onChange}
      merchants={merchants}
      label={label}
      loading={choices.isLoading}
      disabled={disabled}
    />
  );
}
