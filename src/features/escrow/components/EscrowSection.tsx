import type { ReactNode } from "react";
import { Card } from "@/components/ui/card/Card";

interface Props {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/** A titled table block of the escrow page; the card padding keeps the table's own frame off the card border. */
export function EscrowSection({ id, title, description, children }: Props) {
  return (
    <Card role="region" aria-labelledby={id} className="space-y-4 overflow-hidden">
      <div>
        <h2 id={id} className="text-base font-semibold">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </Card>
  );
}
