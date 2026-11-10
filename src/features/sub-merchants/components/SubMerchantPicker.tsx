"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select/Select";
import type { SubMerchantChoice } from "../utils/sub-merchant-choice";

interface Props {
  choices: SubMerchantChoice[];
  /** Sub đang xem; rỗng khi đang xem tất cả (chỉ có nghĩa khi có `allLabel`). */
  value: string;
  /** Nhãn lựa chọn "Tất cả" — chỉ màn mà BE hỗ trợ xem mọi Sub mới truyền; chọn nó bỏ `subMerchantId` khỏi URL. */
  allLabel?: string;
}

/** Giá trị nội bộ của lựa chọn "Tất cả"; không bao giờ ra URL. */
const ALL = "__all__";

/** Picks the Sub a finance screen shows; the choice lives in the URL so the server renders it. */
export function SubMerchantPicker({ choices, value, allLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = allLabel && !value ? ALL : value;
  const choose = (id: string) => {
    if (!id || id === current) return;
    const params = new URLSearchParams(searchParams.toString());
    if (id === ALL) params.delete("subMerchantId");
    else params.set("subMerchantId", id);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select
      label="Sub-merchant"
      placeholder="Chọn Sub-merchant"
      options={[...(allLabel ? [{ label: allLabel, value: ALL }] : []), ...choices.map((choice) => ({ label: choice.label, value: choice.id }))]}
      value={current}
      onChange={choose}
      clearable={false}
    />
  );
}
