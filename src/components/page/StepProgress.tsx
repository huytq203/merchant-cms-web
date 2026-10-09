import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type StepState = "done" | "current" | "failed" | "upcoming";

const dotClass: Record<StepState, string> = {
  done: "border-success bg-success text-white",
  current: "border-primary bg-primary text-primary-foreground",
  failed: "border-danger bg-danger text-white",
  upcoming: "border-border bg-background text-muted-foreground",
};

const labelClass: Record<StepState, string> = {
  done: "text-foreground",
  current: "font-bold text-foreground",
  failed: "font-bold text-danger",
  upcoming: "text-muted-foreground",
};

type Props = { label: string; steps: readonly string[]; states: readonly StepState[] };

/** Where something is on its way through a fixed list of steps; a failed step is flagged, not hidden. */
export function StepProgress({ label, steps, states }: Props) {
  return (
    <ol aria-label={label} className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {steps.map((step, index) => {
        const state = states[index] ?? "upcoming";
        return (
          <li
            key={step}
            aria-current={state === "current" || state === "failed" ? "step" : undefined}
            className={cn("flex items-center gap-1.5 text-xs font-medium", labelClass[state])}
          >
            <span
              aria-hidden="true"
              className={cn("flex size-[18px] items-center justify-center rounded-full border text-[10px]", dotClass[state])}
            >
              {state === "done" ? <Check size={11} strokeWidth={3} /> : index + 1}
            </span>
            {step}
            {index < steps.length - 1 ? <span aria-hidden="true" className="mx-1 h-px w-4 bg-border" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
