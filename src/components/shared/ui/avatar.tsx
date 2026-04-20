import * as React from "react";

import { cn } from "@/lib/utils/cn";

type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  name?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
} as const;

function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(-2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

export function Avatar({
  className,
  name,
  size = "md",
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary/10 font-medium text-primary ring-1 ring-primary/20",
        sizeMap[size],
        className,
      )}
      aria-label={name}
      {...props}
    >
      {initials(name)}
    </div>
  );
}
