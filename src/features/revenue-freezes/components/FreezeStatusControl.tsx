"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/form/SegmentedControl";
import { FREEZE_STATUS_OPTIONS } from "../constants/freeze-labels";
import type { FreezeStatusFilter } from "../types";

/** The status lives in the URL so the server renders the matching list; ALL drops it from the URL. */
export function FreezeStatusControl({ value }: { value: FreezeStatusFilter }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const choose = (status: FreezeStatusFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") params.delete("status");
    else params.set("status", status);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">Trạng thái</span>
      <SegmentedControl options={FREEZE_STATUS_OPTIONS} value={value} onChange={choose} ariaLabel="Trạng thái" />
    </div>
  );
}
