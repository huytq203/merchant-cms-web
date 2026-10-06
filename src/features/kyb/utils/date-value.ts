import { format, isValid, parseISO } from "date-fns";

/** `yyyy-MM-dd` string from the API to the local Date the DatePicker wants. */
export function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function formatIsoDate(value: Date | { from?: Date } | undefined): string {
  if (value instanceof Date && isValid(value)) return format(value, "yyyy-MM-dd");
  return "";
}
