import type { ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/utils/cn';

/** Attributes the control must spread so the label, hint and error stay linked to it. */
export interface FormModalControlProps {
  id: string;
  'aria-required'?: true;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

interface FormModalFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  /** Spans the whole row of a two-column grid. */
  wide?: boolean;
  children: (control: FormModalControlProps) => ReactNode;
}

/** Two equal columns on tablet and up, one column on mobile. */
export function FormModalGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

export function FormModalField({ label, required, error, hint, wide, children }: FormModalFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error) || Boolean(hint);
  const control: FormModalControlProps = {
    id,
    ...(required ? { 'aria-required': true as const } : {}),
    ...(error ? { 'aria-invalid': true as const } : {}),
    ...(hasMessage ? { 'aria-describedby': messageId } : {}),
  };

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', wide && 'sm:col-span-2')}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        ) : null}
      </label>
      {children(control)}
      {error ? (
        <p id={messageId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <div id={messageId} className="text-xs text-muted-foreground">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
