import type { ElementType, ReactNode } from "react";

type InfoRowProps = {
  label: string;
  value: ReactNode;
  valueClassName?: string;
};

export function InfoRow({ label, value, valueClassName }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className={`text-right text-sm font-medium ${valueClassName ?? "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

type SectionTitleProps = {
  icon: ElementType;
  title: string;
};

export function SectionTitle({ icon: Icon, title }: SectionTitleProps) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </span>
    </div>
  );
}
