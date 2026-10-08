import { format } from "date-fns";

/** "09:04, 07/10/2026"; undefined when the BE sent no usable date. */
export function formatCreatedAt(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : format(date, "HH:mm, dd/MM/yyyy");
}
