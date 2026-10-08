import type { ReactNode } from 'react';

export interface DetailSectionProps { icon?: ReactNode; title: string; aside?: ReactNode; /** Drops the divider and bottom padding when the parent spaces sections itself. */ bare?: boolean; children: ReactNode; }

export function DetailSection({ icon, title, aside, bare, children }: DetailSectionProps) {
  return <section className={bare ? 'space-y-3' : 'space-y-3 border-b border-border pb-4 last:border-b-0 last:pb-0'}><h3 className="flex items-center gap-2 text-sm font-bold text-brand-ink">{icon ? <span className="h-4 w-4 text-primary">{icon}</span> : null}{title}{aside ? <span className="ml-auto text-xs font-medium tabular-nums text-muted-foreground">{aside}</span> : null}</h3>{children}</section>;
}

export interface DetailListProps { children: ReactNode; }

export function DetailList({ children }: DetailListProps) { return <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">{children}</dl>; }

export interface DetailItemProps { label: string; children: ReactNode; wide?: boolean; }

export function DetailItem({ label, children, wide }: DetailItemProps) {
  return <div className={wide ? 'sm:col-span-2' : undefined}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 flex flex-wrap items-center gap-2 text-foreground">{children}</dd></div>;
}
