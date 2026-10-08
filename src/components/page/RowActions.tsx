"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip/Tooltip";

export interface RowAction {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  visible?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

interface RowIconActionProps extends RowAction {
  subject: string;
}

export function RowIconAction({ label, icon, onClick, subject, disabled, disabledReason }: RowIconActionProps) {
  const accessibleName = `${label} ${subject}`;
  const tooltip = disabled ? (disabledReason ?? label) : label;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex size-8">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={accessibleName}
              disabled={disabled}
              onClick={onClick}
            >
              {icon}
            </Button>
          </span>
        }
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

interface RowActionsProps {
  subject: string;
  actions: RowAction[];
}

export function RowActions({ subject, actions }: RowActionsProps) {
  const visibleActions = actions.filter((action) => action.visible !== false);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 whitespace-nowrap">
        {visibleActions.map((action) => (
          <span key={action.label} className="inline-flex size-8">
            <RowIconAction subject={subject} {...action} />
          </span>
        ))}
      </div>
    </TooltipProvider>
  );
}
