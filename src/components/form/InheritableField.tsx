'use client';

import { useId, type ReactNode } from 'react';
import { Link2 } from 'lucide-react';
import { SegmentedControl } from './SegmentedControl';

interface InheritableFieldProps {
  label: string;
  /** Where the value comes from when inherited, for example "Master" or "Sub-merchant". */
  sourceName: string;
  inherited: boolean;
  onInheritedChange: (inherited: boolean) => void;
  /** The control for an own value, given the id that links it to the label. */
  children: (id: string) => ReactNode;
}

/**
 * A field that either takes its value from a parent record or holds its own.
 * One rule for every case: the choice sits next to the label; inheriting shows where the value comes from, not the value itself.
 */
export function InheritableField({ label, sourceName, inherited, onInheritedChange, children }: InheritableFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
        <SegmentedControl
          ariaLabel={`Nguồn ${label.toLowerCase()}`}
          value={inherited ? 'inherit' : 'own'}
          onChange={(next) => onInheritedChange(next === 'inherit')}
          options={[
            { value: 'inherit', label: `Dùng của ${sourceName}` },
            { value: 'own', label: 'Nhập riêng' },
          ]}
        />
      </div>
      {inherited ? (
        <div id={id} className="flex items-start gap-2.5 rounded-xl border border-divider bg-accent px-3.5 py-2.5 text-sm text-muted-foreground">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            {label} sẽ lấy từ <b className="font-semibold text-foreground">{sourceName}</b>
          </span>
        </div>
      ) : (
        children(id)
      )}
    </div>
  );
}
