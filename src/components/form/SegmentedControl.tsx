'use client';

import { cn } from '@/lib/utils/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for assistive technology, for example "Loại Terminal". */
  ariaLabel: string;
  /** Stretches the options to share the full width, for a field of its own. */
  fullWidth?: boolean;
  className?: string;
}

/** A short list of mutually exclusive options shown side by side, so one tap changes the choice. */
export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel, fullWidth, className }: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex gap-0.5 rounded-lg border border-border bg-accent p-0.5', fullWidth && 'flex w-full', className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              fullWidth && 'flex-1 text-sm',
              selected && 'bg-background font-semibold text-primary shadow-micro',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
