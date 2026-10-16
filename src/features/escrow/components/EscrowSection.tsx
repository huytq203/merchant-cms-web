import type { ReactNode } from "react";
import { Card } from "@/components/ui/card/Card";

interface Props {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/** A titled table block of the escrow page; the title names the region for assistive technology. */
export function EscrowSection({ id, title, description, children }: Props) {
  return (
    <Card padding="none" role="region" aria-labelledby={id} className="overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 id={id} className="text-base font-semibold">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </Card>
  );
}
