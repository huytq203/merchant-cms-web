import type { ReactNode } from "react";

type Props = { label: string; value?: string; children?: ReactNode };

/** `min-w-0` and `overflow-wrap:anywhere` keep a long URL or file name inside its grid column. */
export function DetailRow({ label, value, children }: Props) {
  return (
    <div className="grid min-w-0 gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground [overflow-wrap:anywhere]">{children ?? (value || "—")}</dd>
    </div>
  );
}
