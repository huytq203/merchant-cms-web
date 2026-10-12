"use client";

import { Children, type FormEvent, type ReactNode } from "react";
import { Eraser, Search } from "lucide-react";
import { Card } from "@/components/ui/card/Card";
import { Button } from "@/components/ui/button/Button";

interface FilterCardProps {
  children: ReactNode;
  fieldCount: number;
  onSubmit: () => void;
  onClear?: () => void;
  className?: string;
  /** Put the actions in the last grid cell instead of a row below, for a field count that fills the grid with them. */
  actionsInGrid?: boolean;
}

export function FilterCard({ children, fieldCount, onSubmit, onClear, className, actionsInGrid = false }: FilterCardProps) {
  const usesInlineLayout = fieldCount <= 3;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <Card className={className} padding="none">
      <form
        aria-label="Bộ lọc tìm kiếm"
        data-layout={usesInlineLayout ? "inline" : "grid"}
        onSubmit={handleSubmit}
        className="space-y-4 p-4"
      >
        {usesInlineLayout ? (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap gap-4">
              {Children.toArray(children).map((field, index) => (
                <div key={index} className="min-w-[200px] flex-1 basis-[280px]">
                  {field}
                </div>
              ))}
            </div>
            <FilterActions onClear={onClear} className="ml-auto" />
          </div>
        ) : (
          actionsInGrid ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[860px]:grid-cols-4">
              {children}
              <FilterActions onClear={onClear} className="items-end justify-end" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[860px]:grid-cols-4">{children}</div>
              <FilterActions onClear={onClear} className="justify-end" />
            </>
          )
        )}
      </form>
    </Card>
  );
}

interface FilterActionsProps {
  className: string;
  onClear?: () => void;
}

function FilterActions({ className, onClear }: FilterActionsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
          {onClear ? (
            <Button type="button" variant="outline" leftIcon={<Eraser size={16} aria-hidden="true" />} onClick={onClear}>
              Xóa lọc
            </Button>
          ) : null}
          <Button type="submit" variant="solid" leftIcon={<Search size={16} aria-hidden="true" />}>
            Tìm kiếm
          </Button>
    </div>
  );
}
