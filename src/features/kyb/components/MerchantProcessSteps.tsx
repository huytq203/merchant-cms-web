import { AlertCircle, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/helper";
import type { TimelineEntry } from "../utils/merchant-timeline";

type Props = { steps: TimelineEntry[] };

const markerClass: Record<TimelineEntry["variant"], string> = {
  success: "bg-primary text-primary-foreground",
  warning: "bg-warning/[0.16] text-warning",
  danger: "bg-danger/10 text-danger",
  default: "border border-border bg-background text-muted-foreground",
};

function Marker({ variant, index }: { variant: TimelineEntry["variant"]; index: number }) {
  const className = cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold", markerClass[variant]);
  if (variant === "success") return <span className={className}><Check className="size-3.5" aria-hidden /></span>;
  if (variant === "warning") return <span className={className}><Clock className="size-3.5" aria-hidden /></span>;
  if (variant === "danger") return <span className={className}><AlertCircle className="size-3.5" aria-hidden /></span>;
  return <span className={className}>{index + 1}</span>;
}

/** The review of a submitted dossier as a short left-to-right path; stacks on a phone. */
export function MerchantProcessSteps({ steps }: Props) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label="Tiến trình xử lý hồ sơ">
      {steps.map((step, index) => (
        <li key={step.title} className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
          <Marker variant={step.variant} index={index} />
          <div className="grid min-w-0 gap-0.5">
            <span className="text-sm font-medium text-foreground">{step.title}</span>
            {step.description && <span className="break-words text-xs text-muted-foreground">{step.description}</span>}
            {step.time && <span className="text-xs text-muted-foreground">{formatDate(step.time)}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
