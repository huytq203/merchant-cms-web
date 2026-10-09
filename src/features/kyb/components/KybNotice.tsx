import type { ReactNode } from "react";
import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = { tone: "info" | "warning" | "danger"; children: ReactNode };

const toneClass = {
  info: "border border-border bg-secondary text-foreground",
  warning: "bg-warning/[0.16] text-foreground",
  danger: "border border-danger/30 bg-danger/5 text-danger",
} as const;

/** A short message above a form or a summary; danger and warning interrupt, info only explains. */
export function KybNotice({ tone, children }: Props) {
  const Icon = tone === "info" ? Info : AlertCircle;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-lg p-3 text-sm", toneClass[tone])}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
