import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card/Card";
import { ResultState } from "@/components/page/ResultState";

export type RecentRow = { id: string; primary: string; secondary: string; badge: ReactNode; amount: string };

type Props = { title: string; href: Route; rows: RecentRow[]; emptyMessage: string };

export function RecentList({ title, href, rows, emptyMessage }: Props) {
  return (
    <Card className="min-w-0">
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <Link href={href} className="text-[13px] font-semibold text-primary hover:underline">Xem tất cả →</Link>
      </div>
      {rows.length === 0 ? (
        <ResultState state="empty" emptyMessage={emptyMessage} />
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{row.primary}</p>
                <p className="truncate text-xs text-muted-foreground">{row.secondary}</p>
              </div>
              {row.badge}
              <p className="w-28 shrink-0 text-right text-sm font-medium tabular-nums">{row.amount}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
