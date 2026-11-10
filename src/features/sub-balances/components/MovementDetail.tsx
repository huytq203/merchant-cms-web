"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { cn } from "@/lib/utils/cn";
import { formatAmount } from "@/lib/utils/helper";
import { movementQueries } from "../movement-queries";
import type { MovementLine } from "../movement-types";
import { amountToneClass, formatSignedAmount } from "../utils/movement-format";
import { movementBusinessHref } from "../utils/movement-range";

interface Props {
  subMerchantId: string;
  operationId: string;
}

/** The right-hand value of a line: free text when the BE sends no amount, else the amount (with +/− when `signed`). */
function lineValue(line: MovementLine): string | null {
  if (line.amount == null) return line.text ?? null;
  return line.signed ? formatSignedAmount(line.amount) : formatAmount(line.amount);
}

/**
 * One breakdown line. The BE decides what the lines are; the UI only knows how to draw the four flags:
 * `indent` (a part of the line above), `emphasis` (the figure that ties to the balance), `signed` and `note`.
 */
function Line({ line }: { line: MovementLine }) {
  const value = lineValue(line);
  const tone = line.emphasis && line.amount != null && line.amount > 0 ? "text-success" : "text-foreground";
  return (
    <div
      data-indent={line.indent ? "true" : "false"}
      data-emphasis={line.emphasis ? "true" : "false"}
      className={cn("flex items-baseline justify-between gap-4 border-t border-border py-2.5 first:border-t-0", line.indent && "pl-5")}
    >
      <div className="min-w-0">
        <span className={cn(line.indent ? "text-muted-foreground" : "text-foreground", line.emphasis && "font-semibold text-foreground")}>{line.label}</span>
        {line.note ? <p className="text-xs text-muted-foreground">{line.note}</p> : null}
      </div>
      {value ? <span className={cn("shrink-0 break-words text-right tabular-nums", line.emphasis ? "font-bold" : "font-medium", tone)}>{value}</span> : null}
    </div>
  );
}

/** Button text names the page it opens. */
function linkLabel(type: string | undefined): string {
  switch (type) {
    case "ORDER": return "Mở đơn hàng";
    case "WITHDRAWAL": return "Mở lệnh rút";
    case "REFUND": return "Mở hoàn tiền";
    case "FREEZE": return "Mở khoản đóng băng";
    case "ESCROW":
    case "ESCROW_RETURN": return "Mở ký quỹ";
    default: return "Mở trang liên quan";
  }
}

/** Detail of one movement: signed amount, balance after it, the BE-built lines and a link to the business page. */
export function MovementDetail({ subMerchantId, operationId }: Props) {
  const query = useQuery(movementQueries.detail(subMerchantId, operationId));

  if (query.isPending) {
    return (
      <div role="status" aria-label="Đang tải chi tiết" className="grid gap-3">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
        <TriangleAlert aria-hidden="true" className="h-6 w-6" />
        <p className="font-semibold text-foreground">Không tải được chi tiết biến động</p>
        <p>Kiểm tra kết nối rồi thử lại.</p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Thử lại</Button>
      </div>
    );
  }
  const detail = query.data;
  // No link from the BE, or a type with no page in the Portal, hides the button rather than leading to a dead route.
  const href = movementBusinessHref(detail.link, subMerchantId);
  return (
    <div className="grid gap-4">
      <div className="rounded-xl bg-muted p-4">
        <p className={cn("text-2xl font-bold tabular-nums", amountToneClass(detail.amount))}>{formatSignedAmount(detail.amount)}</p>
        <p className="mt-1 text-sm text-muted-foreground">Số dư khả dụng sau giao dịch {formatAmount(detail.balanceAfter)}</p>
      </div>
      <div>{detail.lines.map((line, index) => <Line key={`${line.label}-${index}`} line={line} />)}</div>
      {href ? (
        <Button variant="outline" className="justify-self-start" nativeButton={false} render={<Link href={href} role="link" />}>
          {linkLabel(detail.link?.type)}
        </Button>
      ) : null}
    </div>
  );
}
