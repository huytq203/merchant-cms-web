import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/helper";
import type { Complaint } from "../types/types";
import { buildComplaintSteps, type ComplaintStep } from "../utils/complaint-steps";

const MARK: Record<ComplaintStep["state"], string> = {
  done: "bg-success text-white",
  current: "bg-primary text-primary-foreground",
  upcoming: "border border-border bg-background text-muted-foreground",
  failed: "bg-danger text-white",
};

export function ComplaintSteps({ complaint }: { complaint: Complaint }) {
  const steps = buildComplaintSteps(complaint);
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex gap-2.5 pb-3.5 last:pb-0">
          {index < steps.length - 1 && <span className="absolute bottom-0 left-[10px] top-[22px] w-px bg-border" aria-hidden />}
          <span className={cn("grid size-[22px] shrink-0 place-items-center rounded-full text-[11px] font-bold", MARK[step.state])} aria-hidden>
            {step.state === "done" ? <Check className="size-3" /> : step.state === "failed" ? <X className="size-3" /> : index + 1}
          </span>
          <div className="text-sm">
            <p className="font-semibold">{step.title}</p>
            {step.time && <p className="text-xs text-muted-foreground tabular-nums">{formatDate(step.time)}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
