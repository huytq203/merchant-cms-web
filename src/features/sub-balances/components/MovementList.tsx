"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { cn } from "@/lib/utils/cn";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { movementQueries, type MovementListFilter } from "../movement-queries";
import type { Movement } from "../movement-types";
import { amountToneClass, balanceToneClass, formatBalance, formatSignedAmount } from "../utils/movement-format";
import { MovementTotals } from "./MovementTotals";

interface Props {
  subMerchantId: string;
  filter: MovementListFilter;
  onSelect: (movement: Movement) => void;
}

function ListMessage({ children, role }: { children: React.ReactNode; role?: "alert" }) {
  return <div role={role} className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}

/**
 * What the reference column is called, by row kind (CẦN CHỐT 14 GĐ7): the BE sends the Merchant request code for a
 * disbursement, the return code (MRT…) for a bank return and the top-up order code for a top-up.
 */
function referenceLabel(movement: Movement): string | null {
  if (!movement.reference) return null;
  if (movement.type === "ORDER") return `Mã đơn hàng ${movement.reference}`;
  if (movement.kind === "DISBURSEMENT_RETURN") return `Mã hoàn trả ${movement.reference}`;
  if (movement.type === "DISBURSEMENT") return `Mã yêu cầu ${movement.reference}`;
  if (movement.type === "TOPUP") return `Mã nạp ${movement.reference}`;
  return movement.reference;
}

/**
 * CC-03 (19/11): phần tiền vào của dòng được dùng để trả dư nợ Trả sau (wallet-core giảm nợ trước, phần còn lại vào khả
 * dụng). BE gửi `overdraftDelta` âm cho cả dòng nhả giữ chỗ chi hộ nhưng đó là xoá khoản nợ đã ghi, không phải trả nợ nên
 * loại ra. Dòng ghi nợ (số dương) và dòng không có trường này (BE cũ) trả 0 = không hiện.
 */
function repaidOverdraft(movement: Movement): number {
  const delta = movement.overdraftDelta ?? 0;
  if (delta >= 0 || movement.amount <= 0 || movement.kind === "DISBURSEMENT_RELEASED") return 0;
  return -delta;
}

/** Mã sổ phụ thô của dòng tự trả nợ Trả sau (CC-03) nếu BE chuyển nguyên mã thay vì nhãn: hiện bằng tiếng Việt. */
function movementLabel(movement: Movement): string {
  return movement.label === "REPAY_OVERDRAFT" || movement.kind === "REPAY_OVERDRAFT" ? "Trả nợ Trả sau" : movement.label;
}

function Row({ movement, onSelect }: { movement: Movement; onSelect: (movement: Movement) => void }) {
  // The reference is omitted (not shown as "null") when the BE could not resolve a business code (e.g. the disbursement
  // service was unreachable: the row is still listed). An order row's reference is the merchant's own order code, so it is
  // named "Mã đơn hàng" like everywhere else in the Portal.
  const meta = [referenceLabel(movement), formatVnDateTime(movement.occurredAt)].filter(Boolean).join(" · ");
  // Part of a withdrawal taken by the Master's escrow: it left the available balance but did not reach the bank.
  const setoff = movement.setoffAmount ?? 0;
  const repaid = repaidOverdraft(movement);
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(movement)}
        className="flex w-full min-w-0 cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0">
          <span className="block font-semibold">{movementLabel(movement)}</span>
          <span className="block break-words text-sm text-muted-foreground">{meta}</span>
          {setoff > 0 ? (
            <span className="block break-words text-sm text-muted-foreground">trong đó cấn trừ ký quỹ {formatAmount(setoff)}</span>
          ) : null}
          {repaid > 0 ? (
            <span className="block break-words text-sm text-muted-foreground">trong đó trả nợ Trả sau {formatAmount(repaid)}</span>
          ) : null}
        </span>
        <span className="shrink-0 text-right">
          <span className={cn("block font-semibold tabular-nums", amountToneClass(movement.amount))}>{formatSignedAmount(movement.amount)}</span>
          {/* Negative at the thu-chi hộ khác pocket when the Trả sau debt exceeds what is available: red with a real minus. */}
          <span className={cn("block text-sm tabular-nums", balanceToneClass(movement.balanceAfter))}>Số dư {formatBalance(movement.balanceAfter)}</span>
        </span>
      </button>
    </li>
  );
}

/** Paged list of available-balance movements for the current filter; "Xem thêm" appends the next page. */
export function MovementList({ subMerchantId, filter, onSelect }: Props) {
  const query = useInfiniteQuery(movementQueries.list(subMerchantId, filter));
  const rows = query.data?.pages.flatMap((page) => page.rows) ?? [];
  // Period totals come with every page and do not depend on paging: read them from the first page.
  const summary = query.data?.pages[0]?.summary ?? null;
  const totals = summary ? <div className="mb-3"><MovementTotals summary={summary} overdraftNote={filter.pocket === "OTHER"} /></div> : null;

  if (query.isPending) {
    return (
      <div role="status" aria-label="Đang tải biến động số dư" className="grid gap-3 px-3 py-2">
        {[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-10 w-full" />)}
      </div>
    );
  }
  if (query.isError) {
    return (
      <ListMessage role="alert">
        <TriangleAlert aria-hidden="true" className="h-6 w-6" />
        <p className="font-semibold text-foreground">Không tải được biến động số dư</p>
        <p>Kiểm tra kết nối rồi thử lại.</p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Thử lại</Button>
      </ListMessage>
    );
  }
  if (rows.length === 0) {
    return (
      <div>
        {totals}
        <ListMessage>Không có biến động trong khoảng thời gian này.</ListMessage>
      </div>
    );
  }
  return (
    <div>
      {totals}
      <ul className="divide-y divide-border">
        {rows.map((movement) => <Row key={movement.id} movement={movement} onSelect={onSelect} />)}
      </ul>
      {query.hasNextPage ? (
        <div className="flex justify-center pt-3">
          <Button variant="ghost" size="sm" isLoading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>Xem thêm</Button>
        </div>
      ) : null}
    </div>
  );
}
