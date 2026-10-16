"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/form/SegmentedControl";
import { HOLD_RANGE_OPTIONS } from "../constants/hold-labels";
import type { HoldRange } from "../types";

/** The range lives in the URL so the server renders the matching forecast. */
export function HoldRangeControl({ value }: { value: HoldRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const choose = (range: HoldRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">Khoảng thời gian</span>
      <SegmentedControl options={HOLD_RANGE_OPTIONS} value={value} onChange={choose} ariaLabel="Khoảng thời gian" />
    </div>
  );
}
