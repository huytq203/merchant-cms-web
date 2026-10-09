import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = { tone: "info" | "warning" | "danger" | "success"; children: ReactNode };

const toneClass = {
  info: "border border-border bg-secondary text-foreground",
  warning: "bg-warning/[0.16] text-foreground",
  danger: "border border-danger/30 bg-danger/5 text-danger",
  success: "bg-success-soft text-success",
} as const;

/** A short message above a form or a summary; danger and warning interrupt, info and success only explain. */
export function Notice({ tone, children }: Props) {
  const Icon = tone === "info" ? Info : tone === "success" ? CheckCircle2 : AlertCircle;
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
