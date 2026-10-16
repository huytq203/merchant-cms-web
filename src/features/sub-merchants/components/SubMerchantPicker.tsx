"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select/Select";
import type { SubMerchantChoice } from "../utils/sub-merchant-choice";

interface Props {
  choices: SubMerchantChoice[];
  value: string;
}

/** Picks the Sub a finance screen shows; the choice lives in the URL so the server renders it. */
export function SubMerchantPicker({ choices, value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const choose = (id: string) => {
    if (!id || id === value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("subMerchantId", id);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select
      label="Sub-merchant"
      placeholder="Chọn Sub-merchant"
      options={choices.map((choice) => ({ label: choice.label, value: choice.id }))}
      value={value}
      onChange={choose}
      clearable={false}
    />
  );
}
