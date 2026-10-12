import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils/cn";

export type StatTone = "primary" | "success" | "warning" | "info";

const TONE_CLASS: Record<StatTone, string> = {
  primary: "bg-brand/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning",
  info: "bg-info/15 text-info",
};

const HINT_CLASS = { up: "font-semibold text-success", down: "font-semibold text-danger", flat: "text-muted-foreground" } as const;

type Props = {
  title: string;
  value: string;
  hint: string;
  hintTone?: keyof typeof HINT_CLASS;
  icon: ReactNode;
  tone: StatTone;
  /** When set the whole card opens the page that lists what the number counts. */
  href?: Route;
};

export function StatCard({ title, value, hint, hintTone = "flat", icon, tone, href }: Props) {
  const body = (
    <Card className={cn("h-full", href && "transition-colors hover:bg-muted/60")}>
      <CardContent className="flex items-start gap-3.5 p-5">
        <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl [&_svg]:size-5", TONE_CLASS[tone])}>{icon}</div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
          <p className="whitespace-nowrap text-2xl font-bold tabular-nums leading-tight">{value}</p>
          <p className={cn("text-xs", HINT_CLASS[hintTone])}>{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
      {body}
    </Link>
  ) : (
    body
  );
}
