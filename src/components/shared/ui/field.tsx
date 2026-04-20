"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";
import { Label } from "@/components/shared/ui/label";

type FieldProps = {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: FieldProps) {
  const hasError = Boolean(error);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {hasError ? (
        <p
          className="text-xs text-destructive"
          id={htmlFor ? `${htmlFor}-error` : undefined}
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
