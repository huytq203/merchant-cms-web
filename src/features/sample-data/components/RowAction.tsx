"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip/Tooltip";

type Props = { label: string; onClick: () => void; children: ReactNode; tone?: "default" | "danger" };

/** Icon button for a table row: accessible name and tooltip share the same label. */
export function RowAction({ label, onClick, children, tone = "default" }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className={tone === "danger" ? "text-danger" : undefined}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
