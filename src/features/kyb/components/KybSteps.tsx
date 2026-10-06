import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
  steps: readonly string[];
  /** Zero-based index of the active step. */
  current: number;
};

/** Basuicn has no Stepper, so the bar is composed locally from plain primitives. */
export function KybSteps({ steps, current }: Props) {
  return (
    <ol className="flex items-center gap-2" aria-label="Các bước xác thực KYB">
      {steps.map((label, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        return (
          <li
            key={label}
            className="flex min-w-0 flex-1 items-center gap-2"
            aria-current={isCurrent ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                isDone && "border-primary bg-primary text-primary-foreground",
                isCurrent && "border-primary bg-secondary text-primary",
                !isDone && !isCurrent && "border-border bg-background text-muted-foreground",
              )}
            >
              {isDone ? <Check className="size-4" aria-hidden /> : index + 1}
            </span>
            <span
              className={cn(
                "truncate text-sm",
                isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {index < steps.length - 1 && (
              <span className="h-px min-w-4 flex-1 bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
