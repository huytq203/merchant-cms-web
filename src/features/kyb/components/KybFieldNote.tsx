import { cn } from "@/lib/utils/cn";

type Props = { tone: "warning" | "success"; children: string };

/** A line under a field that tells the user what their input will cause, in the field's own column. */
export function KybFieldNote({ tone, children }: Props) {
  return (
    <p role="status" className={cn("mt-1.5 text-xs font-medium", tone === "warning" ? "text-warning" : "text-success")}>
      {children}
    </p>
  );
}
