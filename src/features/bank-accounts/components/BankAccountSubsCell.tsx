"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip/Tooltip";
import type { BankAssignedSub } from "../types";

/** Số tên Sub hiện thẳng trong ô; phần còn lại gom thành "+N" (đủ tên ở tooltip). */
const MAX_NAMES = 2;

const subName = (sub: BankAssignedSub): string => sub.name || sub.code || "Sub-merchant";
const subTitle = (sub: BankAssignedSub): string => [sub.code, sub.name].filter(Boolean).join(" - ") || "Sub-merchant";

/**
 * Cột "Sub-merchant đang dùng" (SRS v2): TK gán 0..N Sub. Hiện tối đa 2 tên, thêm "+N" khi nhiều hơn, tooltip liệt kê
 * đủ "mã - tên". TK chưa gán Sub nào ghi "Chưa gán" (vẫn là TK hợp lệ trong danh mục Master, chỉ chưa Sub nào dùng).
 */
export function BankAccountSubsCell({ subs }: { subs: readonly BankAssignedSub[] }) {
  if (subs.length === 0) return <span className="text-muted-foreground">Chưa gán</span>;
  const shown = subs.slice(0, MAX_NAMES);
  const rest = subs.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((sub) => (
        <span key={sub.id} className="max-w-[12rem] truncate rounded bg-muted px-1.5 py-0.5 text-xs" title={subTitle(sub)}>
          {subName(sub)}
        </span>
      ))}
      {rest > 0 ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                tabIndex={0}
                aria-label={`Và ${rest} Sub-merchant khác`}
                className="cursor-default rounded bg-muted px-1.5 py-0.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            }
          >
            +{rest}
          </TooltipTrigger>
          <TooltipContent>
            <ul className="space-y-0.5">
              {subs.map((sub) => <li key={sub.id}>{subTitle(sub)}</li>)}
            </ul>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
